import React, { useState, useEffect, useRef } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
	Alert,
	Linking,
	Switch,
	Modal,
	FlatList,
	Pressable,
	StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Fonts } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { styles } from "@/styles/profile";
import { StatItem } from "@/components/profile/stat-item";
import { SpotsChart } from "@/components/profile/spots-chart";
import { EditNameModal } from "@/components/profile/edit-name-modal";
import PhotographerCalendar from "@/components/photographer-calendar";
import { UserProfileSheet } from "@/components/feed/user-profile-sheet";
import type { Id } from "@/convex/_generated/dataModel";

export default function ProfileScreen() {
	const { colors, tint, isDark } = useAppTheme();

	const profile = useQuery(api.userProfile.getProfile);
	const allCars = useQuery(api.spottedCars.getAllSpotted);
	const followerCount = useQuery(
		api.follows.getFollowerCount,
		profile?.userId ? { targetUserId: profile.userId } : "skip"
	);
	const followingUsers = useQuery(api.follows.getFollowingUsers);

	const upsertProfile = useMutation(api.userProfile.upsertProfile);
	const generateUploadUrl = useMutation(api.userProfile.generateUploadUrl);

	const [showFollowing, setShowFollowing] = useState(false);
	const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
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
	const followingCount = followingUsers?.length ?? 0;

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
		<SafeAreaView style={[styles.container, { backgroundColor: colors.pageBg }]}>
			<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
				{/* Header */}
				<View style={styles.header}>
					<Text
						style={[
							styles.headerTitle,
							{ color: colors.textPrimary, fontFamily: Fonts?.rounded ?? undefined },
						]}
					>
						Profile
					</Text>
				</View>

				{/* Avatar + Name */}
				<View style={styles.avatarSection}>
					<TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar} activeOpacity={0.8}>
						<View style={[styles.avatar, { backgroundColor: colors.avatarBg }]}>
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
						<View style={[styles.cameraBadge, { backgroundColor: tint, borderColor: colors.pageBg }]}>
							<IconSymbol name="camera.fill" size={13} color={colors.iconOnTint} />
						</View>
					</TouchableOpacity>

					<TouchableOpacity onPress={handleOpenEditName} style={styles.nameRow} activeOpacity={0.7}>
						<Text style={[styles.displayName, { color: colors.textPrimary }]}>
							{displayName}
						</Text>
						<IconSymbol name="pencil" size={16} color={colors.textSecondary} />
					</TouchableOpacity>
				</View>

				{/* Stats */}
				<View style={[styles.card, styles.statsRow, { backgroundColor: colors.surface }]}>
					<StatItem value={totalSpots} label="Spotted" />
					<View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
					<TouchableOpacity style={styles.statItem} onPress={() => setShowFollowing(true)} activeOpacity={0.7}>
						<Text style={[styles.statValue, { color: colors.textPrimary }]}>{followingCount}</Text>
						<Text style={[styles.statLabel, { color: tint }]}>Following</Text>
					</TouchableOpacity>
					<View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
					<StatItem value={followerCount ?? 0} label="Followers" />
				</View>

				{/* Spot History */}
				<Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
					SPOT HISTORY
				</Text>
				<View style={[styles.card, { backgroundColor: colors.surface }]}>
					{allCars === undefined ? (
						<ActivityIndicator color={tint} style={{ paddingVertical: 24 }} />
					) : allCars.length === 0 ? (
						<Text style={[styles.chartEmpty, { color: colors.textSecondary }]}>
							No spots yet — get out there!
						</Text>
					) : (
						<SpotsChart cars={allCars} />
					)}
				</View>

				{/* Identity */}
				<Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>IDENTITY</Text>
				<View style={[styles.card, { backgroundColor: colors.surface }]}>
					<View style={styles.photographerRow}>
						<View style={styles.photographerLabel}>
							<Text style={[styles.photographerTitle, { color: colors.textPrimary }]}>
								Photographer
							</Text>
							<Text style={[styles.photographerSub, { color: colors.textSecondary }]}>
								You spot cars with a professional eye
							</Text>
						</View>
						<Switch
							value={isPhotographer}
							onValueChange={handleTogglePhotographer}
							trackColor={{ false: colors.switchTrackOff, true: tint }}
							thumbColor={isPhotographer ? colors.iconOnTint : "#FFFFFF"}
						/>
					</View>

					{isPhotographer && (
						<View style={[styles.portfolioSection, { borderTopColor: colors.separator }]}>
							<Text style={[styles.portfolioLabel, { color: colors.textSecondary }]}>
								PORTFOLIO URL
							</Text>
							<View style={styles.portfolioInputRow}>
								<TextInput
									style={[
										styles.portfolioInput,
										{ backgroundColor: colors.inputBg, color: colors.textPrimary },
									]}
									placeholder="yourportfolio.com"
									placeholderTextColor={colors.textPlaceholder}
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
										<IconSymbol name="link" size={18} color={colors.iconOnTint} />
									</TouchableOpacity>
								)}
							</View>
						</View>
					)}
				</View>

				{/* Schedule — photographers only */}
				{isPhotographer && profile?.userId ? (
					<>
						<Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SCHEDULE</Text>
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

			{/* Following list sheet */}
		<Modal visible={showFollowing} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={() => setShowFollowing(false)}>
			<View style={{ flex: 1, justifyContent: "flex-end" }}>
				<Pressable style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setShowFollowing(false)} />
				<View style={[{ borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "80%", backgroundColor: colors.surface }]}>
					<View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
						<View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.separator }} />
					</View>
					<Text style={{ fontSize: 17, fontWeight: "700", color: colors.textPrimary, textAlign: "center", paddingBottom: 12 }}>Following</Text>
					{(followingUsers ?? []).length === 0 ? (
						<Text style={{ textAlign: "center", color: colors.textSecondary, paddingVertical: 32, fontSize: 14 }}>
							You're not following anyone yet
						</Text>
					) : (
						<FlatList
							data={followingUsers}
							keyExtractor={(item) => item.userId}
							renderItem={({ item }) => (
								<TouchableOpacity
									style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}
									onPress={() => { setShowFollowing(false); setSelectedUserId(item.userId as Id<"users">); }}
									activeOpacity={0.7}
								>
									<View style={[styles.avatar, { backgroundColor: colors.avatarBg, width: 44, height: 44, borderRadius: 22 }]}>
										{item.imageUrl ? (
											<Image source={{ uri: item.imageUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} contentFit="cover" />
										) : (
											<Text style={[styles.avatarInitial, { color: tint }]}>{item.displayName.charAt(0).toUpperCase()}</Text>
										)}
									</View>
									<View style={{ flex: 1 }}>
										<Text style={{ fontSize: 15, fontWeight: "600", color: colors.textPrimary }}>{item.displayName}</Text>
										{item.isPhotographer && <Text style={{ fontSize: 12, color: "#7B2D8B", marginTop: 1 }}>Photographer</Text>}
									</View>
								</TouchableOpacity>
							)}
						/>
					)}
					<View style={{ height: 32 }} />
				</View>
			</View>
		</Modal>

		{/* User profile sheet (collection mode) */}
		<Modal visible={selectedUserId !== null} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={() => setSelectedUserId(null)}>
			<View style={{ flex: 1, justifyContent: "flex-end" }}>
				<Pressable style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setSelectedUserId(null)} />
				{selectedUserId !== null && (
					<UserProfileSheet
						userId={selectedUserId}
						currentUserId={profile?.userId ?? null}
						onClose={() => setSelectedUserId(null)}
						mode="collection"
					/>
				)}
			</View>
		</Modal>

		<EditNameModal
				visible={editingName}
				value={nameInput}
				onChange={setNameInput}
				onSave={handleSaveName}
				onClose={() => setEditingName(false)}
			/>
		</SafeAreaView>
	);
}
