import React, { useState, useCallback } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	Modal,
	TextInput,
	Alert,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Image } from "expo-image";

type WatchItem = {
	_id: Id<"watchlist">;
	brand: string;
	model: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBrandLogoUrl(brand: string): string {
	const normalized = brand.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
	return `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/${normalized}.png`;
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function WatchRow({
	item,
	onDelete,
	isDark,
}: {
	item: WatchItem;
	onDelete: () => void;
	isDark: boolean;
}) {
	const [logoError, setLogoError] = useState(false);
	const handleLogoError = useCallback(() => setLogoError(true), []);

	return (
		<View style={[styles.row, { backgroundColor: isDark ? "#1C1C2E" : "#FFFFFF" }]}>
			<View
				style={[styles.rowIcon, { backgroundColor: isDark ? "#252538" : "#F0F0F8" }]}
			>
				{!logoError ? (
					<Image
						source={{ uri: getBrandLogoUrl(item.brand) }}
						style={styles.brandLogo}
						contentFit="contain"
						onError={handleLogoError}
					/>
				) : (
					<Text style={styles.rowEmoji}>🚗</Text>
				)}
			</View>
			<View style={styles.rowText}>
				<Text style={[styles.rowBrand, { color: isDark ? "#9BA1A6" : "#687076" }]}>
					{item.brand.toUpperCase()}
				</Text>
				<Text style={[styles.rowModel, { color: isDark ? "#ECEDEE" : "#11181C" }]}>
					{item.model}
				</Text>
			</View>
			<TouchableOpacity
				style={styles.deleteBtn}
				onPress={onDelete}
				hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
			>
				<IconSymbol name="trash" size={18} color="#FF453A" />
			</TouchableOpacity>
		</View>
	);
}

// ─── Add Modal ────────────────────────────────────────────────────────────────

function AddWatchModal({
	visible,
	onClose,
	isDark,
	tint,
}: {
	visible: boolean;
	onClose: () => void;
	isDark: boolean;
	tint: string;
}) {
	const [brand, setBrand] = useState("");
	const [model, setModel] = useState("");
	const [saving, setSaving] = useState(false);

	const addWatchCar = useMutation(api.watchlist.addWatchCar);

	const handleSave = async () => {
		if (!brand.trim() || !model.trim()) {
			Alert.alert("Missing info", "Please enter both brand and model.");
			return;
		}
		setSaving(true);
		try {
			await addWatchCar({ brand: brand.trim(), model: model.trim() });
			setBrand("");
			setModel("");
			onClose();
		} catch {
			Alert.alert("Error", "Failed to add. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	const handleClose = () => {
		setBrand("");
		setModel("");
		onClose();
	};

	const inputStyle = [
		styles.input,
		{ backgroundColor: isDark ? "#1C1C2E" : "#F5F5F8", color: isDark ? "#ECEDEE" : "#11181C" },
	];

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent
			presentationStyle="overFullScreen"
			onRequestClose={handleClose}
		>
			<KeyboardAvoidingView
				style={styles.modalOverlay}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<View
					style={[styles.modalSheet, { backgroundColor: isDark ? "#151718" : "#FFFFFF" }]}
				>
					<Text style={[styles.modalTitle, { color: isDark ? "#ECEDEE" : "#11181C" }]}>
						Add to Watchlist
					</Text>
					<TextInput
						style={inputStyle}
						placeholder="Brand  (e.g. Ferrari)"
						placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
						value={brand}
						onChangeText={setBrand}
						autoCapitalize="words"
						autoFocus
					/>
					<TextInput
						style={inputStyle}
						placeholder="Model  (e.g. F40)"
						placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
						value={model}
						onChangeText={setModel}
						autoCapitalize="words"
					/>
					<View style={styles.modalBtnRow}>
						<TouchableOpacity
							style={[styles.modalBtn, styles.cancelBtn]}
							onPress={handleClose}
						>
							<Text style={[styles.cancelBtnText, { color: isDark ? "#9BA1A6" : "#687076" }]}>
								Cancel
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.modalBtn, styles.saveBtn, { backgroundColor: tint }]}
							onPress={handleSave}
							disabled={saving}
						>
							{saving ? (
								<ActivityIndicator color={isDark ? "#11181C" : "#FFFFFF"} size="small" />
							) : (
								<Text style={[styles.saveBtnText, { color: isDark ? "#11181C" : "#FFFFFF" }]}>Add</Text>
							)}
						</TouchableOpacity>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

// ─── Watchlist Screen ─────────────────────────────────────────────────────────

export default function WatchlistScreen() {
	const colorScheme = useColorScheme() ?? "light";
	const isDark = colorScheme === "dark";
	const tint = Colors[colorScheme].tint;

	const [showAdd, setShowAdd] = useState(false);

	const items = useQuery(api.watchlist.getAllWatch) as WatchItem[] | undefined;
	const deleteWatchCar = useMutation(api.watchlist.deleteWatchCar);

	const handleDelete = (id: Id<"watchlist">) => {
		Alert.alert("Remove from Watchlist", "Remove this car from your watchlist?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Remove",
				style: "destructive",
				onPress: () => deleteWatchCar({ id }),
			},
		]);
	};

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: isDark ? "#0F0F17" : "#F6F6FA" }]}
		>
			{/* Header */}
			<View style={styles.header}>
				<Text
					style={[
						styles.headerTitle,
						{ color: isDark ? "#ECEDEE" : "#11181C", fontFamily: Fonts?.rounded ?? undefined },
					]}
				>
					Watchlist
				</Text>
				{items !== undefined && items.length > 0 && (
					<Text style={[styles.headerCount, { color: isDark ? "#9BA1A6" : "#687076" }]}>
						{items.length} {items.length === 1 ? "car" : "cars"}
					</Text>
				)}
			</View>

			{/* Content */}
			{items === undefined ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" color={tint} />
				</View>
			) : items.length === 0 ? (
				<View style={styles.centered}>
					<Text style={styles.emptyEmoji}>🔭</Text>
					<Text style={[styles.emptyTitle, { color: isDark ? "#ECEDEE" : "#11181C" }]}>
						Your watchlist is empty
					</Text>
					<Text style={[styles.emptyHint, { color: isDark ? "#9BA1A6" : "#687076" }]}>
						Tap + to add a car you want to spot
					</Text>
				</View>
			) : (
				<FlatList
					style={{ flex: 1 }}
					data={items}
					keyExtractor={(item) => item._id}
					contentContainerStyle={styles.list}
					showsVerticalScrollIndicator={false}
					ItemSeparatorComponent={() => (
						<View
							style={[
								styles.separator,
								{ backgroundColor: isDark ? "#1F1F2E" : "#F0F0F4" },
							]}
						/>
					)}
					renderItem={({ item }) => (
						<WatchRow
							item={item}
							onDelete={() => handleDelete(item._id)}
							isDark={isDark}
						/>
					)}
				/>
			)}

			{/* FAB */}
			<TouchableOpacity
				style={[styles.fab, { backgroundColor: tint }]}
				onPress={() => setShowAdd(true)}
				activeOpacity={0.85}
			>
				<IconSymbol name="plus" size={28} color={isDark ? "#11181C" : "#FFFFFF"} />
			</TouchableOpacity>

			<AddWatchModal
				visible={showAdd}
				onClose={() => setShowAdd(false)}
				isDark={isDark}
				tint={tint}
			/>
		</SafeAreaView>
	);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	container: { flex: 1 },

	header: {
		flexDirection: "row",
		alignItems: "baseline",
		gap: 8,
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 12,
	},
	headerTitle: { fontSize: 28, fontWeight: "700" },
	headerCount: { fontSize: 15 },

	centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
	emptyEmoji: { fontSize: 64, marginBottom: 16 },
	emptyTitle: { fontSize: 20, fontWeight: "600", marginBottom: 8, textAlign: "center" },
	emptyHint: { fontSize: 15, textAlign: "center" },

	list: { paddingHorizontal: 16, paddingBottom: 120 },

	row: {
		flexDirection: "row",
		alignItems: "center",
		padding: 14,
		borderRadius: 16,
		gap: 12,
	},
	rowIcon: {
		width: 44,
		height: 44,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
	},
	rowEmoji: { fontSize: 22 },
	brandLogo: { width: 32, height: 32 },
	rowText: { flex: 1 },
	rowBrand: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 2 },
	rowModel: { fontSize: 16, fontWeight: "600" },
	deleteBtn: { padding: 4 },

	separator: { height: 8, marginHorizontal: 0 },

	fab: {
		position: "absolute",
		bottom: 28,
		right: 24,
		width: 60,
		height: 60,
		borderRadius: 30,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.28,
		shadowRadius: 8,
		elevation: 8,
	},

	modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
	modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
	modalTitle: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
	input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 12 },
	modalBtnRow: { flexDirection: "row", gap: 12, marginTop: 4 },
	modalBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
	cancelBtn: { backgroundColor: "rgba(128,128,128,0.12)" },
	saveBtn: {},
	cancelBtnText: { fontSize: 16, fontWeight: "600" },
	saveBtnText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
});
