import React, { useState, useMemo, useEffect, useRef } from "react";
import PhotographerCalendar from "@/components/photographer-calendar";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	Modal,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	Alert,
	Linking,
	Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

const CHART_BAR_HEIGHT = 110;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthBuckets() {
	const now = new Date();
	return Array.from({ length: 6 }, (_, i) => {
		const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
		return {
			key: `${d.getFullYear()}-${d.getMonth()}`,
			label: d.toLocaleString("default", { month: "short" }),
			count: 0,
		};
	});
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function SpotsChart({
	cars,
	isDark,
	tint,
}: {
	cars: { _creationTime: number }[];
	isDark: boolean;
	tint: string;
}) {
	const months = useMemo(() => {
		const buckets = getMonthBuckets();
		for (const car of cars) {
			const date = new Date(car._creationTime);
			const key = `${date.getFullYear()}-${date.getMonth()}`;
			const bucket = buckets.find((b) => b.key === key);
			if (bucket) bucket.count++;
		}
		return buckets;
	}, [cars]);

	const maxCount = Math.max(...months.map((m) => m.count), 1);

	return (
		<View style={styles.chartWrap}>
			{months.map((m) => {
				const barH = m.count > 0
					? Math.max((m.count / maxCount) * CHART_BAR_HEIGHT, 8)
					: 0;
				return (
					<View key={m.key} style={styles.barCol}>
						{m.count > 0 && (
							<Text style={[styles.barValue, { color: isDark ? "#9BA1A6" : "#687076" }]}>
								{m.count}
							</Text>
						)}
						<View
							style={[
								styles.barTrack,
								{ backgroundColor: isDark ? "#252538" : "#EBEBF0" },
							]}
						>
							<View
								style={[
									styles.barFill,
									{ height: barH, backgroundColor: tint },
								]}
							/>
						</View>
						<Text style={[styles.barMonth, { color: isDark ? "#9BA1A6" : "#687076" }]}>
							{m.label}
						</Text>
					</View>
				);
			})}
		</View>
	);
}

// ─── Stat Item ────────────────────────────────────────────────────────────────

function StatItem({
	value,
	label,
	isDark,
}: {
	value: number;
	label: string;
	isDark: boolean;
}) {
	return (
		<View style={styles.statItem}>
			<Text style={[styles.statValue, { color: isDark ? "#ECEDEE" : "#11181C" }]}>
				{value}
			</Text>
			<Text style={[styles.statLabel, { color: isDark ? "#9BA1A6" : "#687076" }]}>
				{label}
			</Text>
		</View>
	);
}

// ─── Profile Screen ───────────────────────────────────────────────────────────

export default function ProfileScreen() {
	const colorScheme = useColorScheme() ?? "light";
	const isDark = colorScheme === "dark";
	const tint = Colors[colorScheme].tint;
	const bgColor = isDark ? "#0F0F17" : "#F6F6FA";
	const cardBg = isDark ? "#1C1C2E" : "#FFFFFF";

	const profile = useQuery(api.userProfile.getProfile);
	const allCars = useQuery(api.spottedCars.getAllSpotted);
	const watchlist = useQuery(api.watchlist.getAllWatch);

	const upsertProfile = useMutation(api.userProfile.upsertProfile);
	const generateUploadUrl = useMutation(api.userProfile.generateUploadUrl);

	const [editingName, setEditingName] = useState(false);
	const [nameInput, setNameInput] = useState("");
	const [portfolioInput, setPortfolioInput] = useState("");
	const [uploadingAvatar, setUploadingAvatar] = useState(false);

	const portfolioInitialized = useRef(false);
	useEffect(() => {
		if (profile !== undefined && !portfolioInitialized.current) {
			setPortfolioInput(profile?.portfolioUrl ?? "");
			portfolioInitialized.current = true;
		}
	}, [profile]);

	const totalSpots = allCars?.length ?? 0;
	const favorites = allCars?.filter((c) => c.isFavorite).length ?? 0;
	const watchlistCount = watchlist?.length ?? 0;

	const displayName = profile?.displayName ?? "Car Spotter";
	const isPhotographer = profile?.isPhotographer ?? false;

	const handlePickAvatar = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permission needed", "Please allow photo access in Settings.");
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		});
		if (result.canceled) return;
		const uri = result.assets[0].uri;
		setUploadingAvatar(true);
		try {
			const uploadUrl = await generateUploadUrl();
			const blob = await (await fetch(uri)).blob();
			const uploadRes = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": blob.type },
				body: blob,
			});
			const { storageId } = await uploadRes.json();
			await upsertProfile({ imageStorageId: storageId });
		} catch {
			Alert.alert("Error", "Failed to upload photo.");
		} finally {
			setUploadingAvatar(false);
		}
	};

	const handleOpenEditName = () => {
		setNameInput(profile?.displayName ?? "");
		setEditingName(true);
	};

	const handleSaveName = async () => {
		const name = nameInput.trim();
		if (!name) return;
		await upsertProfile({ displayName: name });
		setEditingName(false);
	};

	const handleTogglePhotographer = async () => {
		await upsertProfile({ isPhotographer: !isPhotographer });
	};

	const handleSavePortfolio = async () => {
		await upsertProfile({ portfolioUrl: portfolioInput.trim() });
	};

	const handleOpenPortfolio = async () => {
		const url = portfolioInput.trim();
		if (!url) return;
		const fullUrl = url.startsWith("http") ? url : `https://${url}`;
		try {
			await Linking.openURL(fullUrl);
		} catch {
			Alert.alert("Error", "Could not open that URL.");
		}
	};

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scroll}
			>
				{/* Header */}
				<View style={styles.header}>
					<Text
						style={[
							styles.headerTitle,
							{
								color: isDark ? "#ECEDEE" : "#11181C",
								fontFamily: Fonts?.rounded ?? undefined,
							},
						]}
					>
						Profile
					</Text>
				</View>

				{/* Avatar + Name */}
				<View style={styles.avatarSection}>
					<TouchableOpacity
						onPress={handlePickAvatar}
						disabled={uploadingAvatar}
						activeOpacity={0.8}
					>
						<View
							style={[
								styles.avatar,
								{ backgroundColor: isDark ? "#252538" : "#E8E8F0" },
							]}
						>
							{profile?.imageUrl ? (
								<Image
									source={{ uri: profile.imageUrl }}
									style={styles.avatarImage}
									contentFit="cover"
								/>
							) : (
								<Text style={[styles.avatarInitial, { color: tint }]}>
									{displayName.charAt(0).toUpperCase()}
								</Text>
							)}
							{uploadingAvatar && (
								<View style={styles.avatarOverlay}>
									<ActivityIndicator color="#FFFFFF" />
								</View>
							)}
						</View>
						<View
							style={[
								styles.cameraBadge,
								{ backgroundColor: tint, borderColor: bgColor },
							]}
						>
							<IconSymbol
								name="camera.fill"
								size={13}
								color={isDark ? "#11181C" : "#FFFFFF"}
							/>
						</View>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={handleOpenEditName}
						style={styles.nameRow}
						activeOpacity={0.7}
					>
						<Text
							style={[
								styles.displayName,
								{ color: isDark ? "#ECEDEE" : "#11181C" },
							]}
						>
							{displayName}
						</Text>
						<IconSymbol
							name="pencil"
							size={16}
							color={isDark ? "#9BA1A6" : "#687076"}
						/>
					</TouchableOpacity>
				</View>

				{/* Stats */}
				<View
					style={[
						styles.card,
						styles.statsRow,
						{ backgroundColor: cardBg },
					]}
				>
					<StatItem value={totalSpots} label="Spotted" isDark={isDark} />
					<View
						style={[
							styles.statDivider,
							{ backgroundColor: isDark ? "#252538" : "#F0F0F4" },
						]}
					/>
					<StatItem value={favorites} label="Favorites" isDark={isDark} />
					<View
						style={[
							styles.statDivider,
							{ backgroundColor: isDark ? "#252538" : "#F0F0F4" },
						]}
					/>
					<StatItem value={watchlistCount} label="Watchlist" isDark={isDark} />
				</View>

				{/* Spot History */}
				<Text
					style={[
						styles.sectionTitle,
						{ color: isDark ? "#9BA1A6" : "#687076" },
					]}
				>
					SPOT HISTORY
				</Text>
				<View style={[styles.card, { backgroundColor: cardBg }]}>
					{allCars === undefined ? (
						<ActivityIndicator
							color={tint}
							style={{ paddingVertical: 24 }}
						/>
					) : allCars.length === 0 ? (
						<Text
							style={[
								styles.chartEmpty,
								{ color: isDark ? "#9BA1A6" : "#687076" },
							]}
						>
							No spots yet — get out there!
						</Text>
					) : (
						<SpotsChart cars={allCars} isDark={isDark} tint={tint} />
					)}
				</View>

				{/* Identity */}
				<Text
					style={[
						styles.sectionTitle,
						{ color: isDark ? "#9BA1A6" : "#687076" },
					]}
				>
					IDENTITY
				</Text>
				<View style={[styles.card, { backgroundColor: cardBg }]}>
					<View style={styles.photographerRow}>
						<View style={styles.photographerLabel}>
							<Text
								style={[
									styles.photographerTitle,
									{ color: isDark ? "#ECEDEE" : "#11181C" },
								]}
							>
								Photographer
							</Text>
							<Text
								style={[
									styles.photographerSub,
									{ color: isDark ? "#9BA1A6" : "#687076" },
								]}
							>
								You spot cars with a professional eye
							</Text>
						</View>
						<Switch
							value={isPhotographer}
							onValueChange={handleTogglePhotographer}
							trackColor={{
								false: isDark ? "#3A3A4E" : "#D1D1D6",
								true: "#0a7ea4",
							}}
							thumbColor="#FFFFFF"
						/>
					</View>

					{isPhotographer && (
						<View
							style={[
								styles.portfolioSection,
								{
									borderTopColor: isDark ? "#252538" : "#F0F0F4",
								},
							]}
						>
							<Text
								style={[
									styles.portfolioLabel,
									{ color: isDark ? "#9BA1A6" : "#687076" },
								]}
							>
								PORTFOLIO URL
							</Text>
							<View style={styles.portfolioInputRow}>
								<TextInput
									style={[
										styles.portfolioInput,
										{
											backgroundColor: isDark ? "#252538" : "#F5F5F8",
											color: isDark ? "#ECEDEE" : "#11181C",
										},
									]}
									placeholder="yourportfolio.com"
									placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
									value={portfolioInput}
									onChangeText={setPortfolioInput}
									autoCapitalize="none"
									keyboardType="url"
									returnKeyType="done"
									onSubmitEditing={handleSavePortfolio}
									onBlur={handleSavePortfolio}
								/>
								{portfolioInput.trim().length > 0 && (
									<TouchableOpacity
										onPress={handleOpenPortfolio}
										style={[styles.visitBtn, { backgroundColor: tint }]}
										activeOpacity={0.8}
									>
										<IconSymbol
											name="link"
											size={18}
											color={isDark ? "#11181C" : "#FFFFFF"}
										/>
									</TouchableOpacity>
								)}
							</View>
						</View>
					)}
				</View>

			{/* Schedule — photographers only */}
				{isPhotographer && profile?.userId ? (
					<>
						<Text
							style={[
								styles.sectionTitle,
								{ color: isDark ? "#9BA1A6" : "#687076" },
							]}
						>
							SCHEDULE
						</Text>
						<View style={{ marginHorizontal: 16 }}>
							<PhotographerCalendar
								photographerId={profile.userId}
								isOwner
								currentUserId={profile.userId}
								isDark={isDark}
								tint={tint}
							/>
						</View>
					</>
				) : null}

				<View style={{ height: 48 }} />
			</ScrollView>

			{/* Edit Name Modal */}
			<Modal
				visible={editingName}
				animationType="slide"
				transparent
				presentationStyle="overFullScreen"
				onRequestClose={() => setEditingName(false)}
			>
				<KeyboardAvoidingView
					style={styles.modalOverlay}
					behavior={Platform.OS === "ios" ? "padding" : undefined}
				>
					<View
						style={[
							styles.modalSheet,
							{ backgroundColor: isDark ? "#151718" : "#FFFFFF" },
						]}
					>
						<Text
							style={[
								styles.modalTitle,
								{ color: isDark ? "#ECEDEE" : "#11181C" },
							]}
						>
							Display Name
						</Text>
						<TextInput
							style={[
								styles.modalInput,
								{
									backgroundColor: isDark ? "#1C1C2E" : "#F5F5F8",
									color: isDark ? "#ECEDEE" : "#11181C",
								},
							]}
							placeholder="Your name"
							placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
							value={nameInput}
							onChangeText={setNameInput}
							autoCapitalize="words"
							autoFocus
							returnKeyType="done"
							onSubmitEditing={handleSaveName}
						/>
						<View style={styles.modalBtnRow}>
							<TouchableOpacity
								style={[styles.modalBtn, styles.cancelBtn]}
								onPress={() => setEditingName(false)}
							>
								<Text
									style={[
										styles.cancelBtnText,
										{ color: isDark ? "#9BA1A6" : "#687076" },
									]}
								>
									Cancel
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.modalBtn,
									styles.saveBtn,
									{ backgroundColor: tint },
								]}
								onPress={handleSaveName}
							>
								<Text
									style={[
										styles.saveBtnText,
										{ color: isDark ? "#11181C" : "#FFFFFF" },
									]}
								>
									Save
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</SafeAreaView>
	);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	container: { flex: 1 },
	scroll: { paddingBottom: 40 },

	header: {
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 12,
	},
	headerTitle: { fontSize: 28, fontWeight: "700" },

	// Avatar
	avatarSection: {
		alignItems: "center",
		paddingTop: 12,
		paddingBottom: 28,
	},
	avatar: {
		width: 90,
		height: 90,
		borderRadius: 45,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
	},
	avatarImage: { width: 90, height: 90 },
	avatarInitial: { fontSize: 36, fontWeight: "700" },
	avatarOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.45)",
		justifyContent: "center",
		alignItems: "center",
	},
	cameraBadge: {
		position: "absolute",
		bottom: 0,
		right: 0,
		width: 28,
		height: 28,
		borderRadius: 14,
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 2,
	},
	nameRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 14,
	},
	displayName: { fontSize: 22, fontWeight: "700" },

	// Section
	sectionTitle: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1.2,
		paddingHorizontal: 16,
		marginTop: 24,
		marginBottom: 10,
	},

	// Card
	card: {
		marginHorizontal: 16,
		borderRadius: 20,
		padding: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 2,
	},

	// Stats
	statsRow: { flexDirection: "row", alignItems: "center" },
	statItem: { flex: 1, alignItems: "center", paddingVertical: 4 },
	statValue: { fontSize: 26, fontWeight: "700", marginBottom: 3 },
	statLabel: { fontSize: 12, fontWeight: "500" },
	statDivider: { width: 1, height: 36 },

	// Chart
	chartWrap: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 6,
		paddingTop: 8,
	},
	barCol: {
		flex: 1,
		alignItems: "center",
		gap: 4,
	},
	barValue: { fontSize: 10, fontWeight: "600" },
	barTrack: {
		width: "100%",
		height: CHART_BAR_HEIGHT,
		borderRadius: 8,
		justifyContent: "flex-end",
		overflow: "hidden",
	},
	barFill: {
		width: "100%",
		borderRadius: 8,
	},
	barMonth: { fontSize: 11, fontWeight: "500", marginTop: 4 },
	chartEmpty: {
		textAlign: "center",
		paddingVertical: 28,
		fontSize: 14,
	},

	// Photographer
	photographerRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	photographerLabel: { flex: 1 },
	photographerTitle: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
	photographerSub: { fontSize: 13 },
	portfolioSection: {
		marginTop: 16,
		paddingTop: 16,
		borderTopWidth: 1,
	},
	portfolioLabel: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1,
		marginBottom: 10,
	},
	portfolioInputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
	portfolioInput: {
		flex: 1,
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
		fontSize: 15,
	},
	visitBtn: {
		width: 46,
		height: 46,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
	},

	// Modal
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "flex-end",
	},
	modalSheet: {
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		padding: 24,
		paddingBottom: 44,
	},
	modalTitle: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
	modalInput: {
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		marginBottom: 12,
	},
	modalBtnRow: { flexDirection: "row", gap: 12, marginTop: 4 },
	modalBtn: {
		flex: 1,
		paddingVertical: 15,
		borderRadius: 14,
		alignItems: "center",
	},
	cancelBtn: { backgroundColor: "rgba(128,128,128,0.12)" },
	saveBtn: {},
	cancelBtnText: { fontSize: 16, fontWeight: "600" },
	saveBtnText: { fontSize: 16, fontWeight: "600" },
});
