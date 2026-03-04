import React, { useState, useMemo } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	Modal,
	TextInput,
	Alert,
	Pressable,
	Dimensions,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as ImagePicker from "expo-image-picker";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

type SpottedCar = {
	_id: Id<"spottedCars">;
	brand: string;
	model: string;
	horsepower?: number;
	spottedDate?: string;
	price?: number;
	isFavorite?: boolean;
	imageUrl: string | null;
};

type SortKey = "date" | "name" | "horsepower" | "price";
type SortDir = "asc" | "desc";

const SORT_OPTIONS: { key: SortKey; label: string; defaultDir: SortDir }[] = [
	{ key: "date", label: "Date", defaultDir: "desc" },
	{ key: "name", label: "Name", defaultDir: "asc" },
	{ key: "horsepower", label: "HP", defaultDir: "desc" },
	{ key: "price", label: "Price", defaultDir: "desc" },
];

function formatPriceCompact(price: number): string {
	if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
	if (price >= 1_000) return `$${Math.round(price / 1_000)}K`;
	return `$${price}`;
}

// ─── Car Card ────────────────────────────────────────────────────────────────

function CarCard({ car, onPress, onToggleFavorite }: { car: SpottedCar; onPress: () => void; onToggleFavorite: () => void }) {
	const colorScheme = useColorScheme() ?? "light";
	const isDark = colorScheme === "dark";

	return (
		<Pressable
			style={[styles.card, { backgroundColor: isDark ? "#1C1C2E" : "#FFFFFF" }]}
			onPress={onPress}
			android_ripple={{ color: "rgba(0,0,0,0.08)" }}
		>
			<View style={styles.cardImageWrap}>
				{car.imageUrl ? (
					<Image source={{ uri: car.imageUrl }} style={styles.cardImage} contentFit="cover" />
				) : (
					<View
						style={[
							styles.cardImagePlaceholder,
							{ backgroundColor: isDark ? "#252538" : "#F0F0F8" },
						]}
					>
						<Ionicons name="car-sport-outline" size={40} color={isDark ? "#4A5568" : "#A0AEC0"} />
					</View>
				)}
				<View style={styles.brandStrip}>
					<Text style={styles.brandStripText} numberOfLines={1}>
						{car.brand.toUpperCase()}
					</Text>
				</View>
				<TouchableOpacity
					style={styles.starBtn}
					onPress={(e) => { e.stopPropagation?.(); onToggleFavorite(); }}
					hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
				>
					<IconSymbol
						name={car.isFavorite ? "star.fill" : "star"}
						size={14}
						color={car.isFavorite ? "#FFD700" : "rgba(255,255,255,0.7)"}
					/>
				</TouchableOpacity>
			</View>

			<View style={[styles.cardFooter, { backgroundColor: isDark ? "#1C1C2E" : "#FFFFFF" }]}>
				<Text
					style={[styles.cardModel, { color: isDark ? "#ECEDEE" : "#11181C" }]}
					numberOfLines={1}
				>
					{car.model}
				</Text>
				<View style={styles.cardStats}>
					{car.horsepower !== undefined && (
						<View style={styles.statPill}>
							<Ionicons name="flash-outline" size={10} color={isDark ? "#9BA1A6" : "#687076"} />
							<Text style={[styles.statPillText, { color: isDark ? "#9BA1A6" : "#687076" }]}>
								{car.horsepower}
							</Text>
						</View>
					)}
					{car.price !== undefined && (
						<View style={styles.statPill}>
							<Ionicons name="pricetag-outline" size={10} color={isDark ? "#9BA1A6" : "#687076"} />
							<Text style={[styles.statPillText, { color: isDark ? "#9BA1A6" : "#687076" }]}>
								{formatPriceCompact(car.price)}
							</Text>
						</View>
					)}
				</View>
			</View>
		</Pressable>
	);
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function CarDetailModal({
	car,
	visible,
	onClose,
}: {
	car: SpottedCar | null;
	visible: boolean;
	onClose: () => void;
}) {
	const colorScheme = useColorScheme() ?? "light";
	const isDark = colorScheme === "dark";

	if (!car) return null;

	const formattedDate = car.spottedDate
		? new Date(car.spottedDate).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
		  })
		: "Unknown";

	const formattedPrice =
		car.price !== undefined ? `$${car.price.toLocaleString()}` : "—";

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent
			presentationStyle="overFullScreen"
			onRequestClose={onClose}
		>
			<View style={styles.detailOverlay}>
				<View
					style={[styles.detailSheet, { backgroundColor: isDark ? "#151718" : "#FFFFFF" }]}
				>
					<View style={styles.detailImageWrap}>
						{car.imageUrl ? (
							<Image
								source={{ uri: car.imageUrl }}
								style={styles.detailImage}
								contentFit="cover"
							/>
						) : (
							<View
								style={[
									styles.detailImagePlaceholder,
									{ backgroundColor: isDark ? "#252538" : "#F0F0F8" },
								]}
							>
								<Ionicons name="car-sport-outline" size={80} color={isDark ? "#4A5568" : "#A0AEC0"} />
							</View>
						)}
						<TouchableOpacity style={styles.closeBtn} onPress={onClose}>
							<Text style={styles.closeBtnText}>✕</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.detailBody}>
						<Text style={[styles.detailBrand, { color: isDark ? "#9BA1A6" : "#687076" }]}>
							{car.brand.toUpperCase()}
						</Text>
						<Text style={[styles.detailModel, { color: isDark ? "#ECEDEE" : "#11181C" }]}>
							{car.model}
						</Text>

						<View
							style={[styles.divider, { backgroundColor: isDark ? "#2A2A3E" : "#EBEBEB" }]}
						/>

						<View style={styles.statsRow}>
							<View style={styles.statItem}>
								<Ionicons name="calendar-outline" size={22} color={isDark ? "#9BA1A6" : "#687076"} />
								<Text style={[styles.statLabel, { color: isDark ? "#9BA1A6" : "#687076" }]}>
									SPOTTED
								</Text>
								<Text style={[styles.statValue, { color: isDark ? "#ECEDEE" : "#11181C" }]}>
									{formattedDate}
								</Text>
							</View>

							<View
								style={[
									styles.statDivider,
									{ backgroundColor: isDark ? "#2A2A3E" : "#EBEBEB" },
								]}
							/>

							<View style={styles.statItem}>
								<Ionicons name="flash-outline" size={22} color={isDark ? "#9BA1A6" : "#687076"} />
								<Text style={[styles.statLabel, { color: isDark ? "#9BA1A6" : "#687076" }]}>
									POWER
								</Text>
								<Text style={[styles.statValue, { color: isDark ? "#ECEDEE" : "#11181C" }]}>
									{car.horsepower !== undefined ? `${car.horsepower} HP` : "—"}
								</Text>
							</View>

							<View
								style={[
									styles.statDivider,
									{ backgroundColor: isDark ? "#2A2A3E" : "#EBEBEB" },
								]}
							/>

							<View style={styles.statItem}>
								<Ionicons name="pricetag-outline" size={22} color={isDark ? "#9BA1A6" : "#687076"} />
								<Text style={[styles.statLabel, { color: isDark ? "#9BA1A6" : "#687076" }]}>
									PRICE
								</Text>
								<Text style={[styles.statValue, { color: isDark ? "#ECEDEE" : "#11181C" }]}>
									{formattedPrice}
								</Text>
							</View>
						</View>
					</View>
				</View>
			</View>
		</Modal>
	);
}

// ─── Add Car Modal ────────────────────────────────────────────────────────────

function AddCarModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
	const colorScheme = useColorScheme() ?? "light";
	const isDark = colorScheme === "dark";

	const [brand, setBrand] = useState("");
	const [model, setModel] = useState("");
	const [horsepower, setHorsepower] = useState("");
	const [price, setPrice] = useState("");
	const [imageUri, setImageUri] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const addSpottedCar = useMutation(api.spottedCars.addSpottedCar);
	const generateUploadUrl = useMutation(api.spottedCars.generateUploadUrl);

	const handlePhoto = async () => {
		const camPerm = await ImagePicker.requestCameraPermissionsAsync();
		const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
		const canCamera = camPerm.status === "granted";
		const canLibrary = libPerm.status === "granted";

		if (!canCamera && !canLibrary) {
			Alert.alert("Permission needed", "Camera or photo library access is required.");
			return;
		}

		const launchCamera = async () => {
			const result = await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.8 });
			if (!result.canceled) setImageUri(result.assets[0].uri);
		};

		const launchLibrary = async () => {
			const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.8 });
			if (!result.canceled) setImageUri(result.assets[0].uri);
		};

		if (canCamera && canLibrary) {
			Alert.alert("Add Photo", "", [
				{ text: "Take Photo", onPress: launchCamera },
				{ text: "Choose from Library", onPress: launchLibrary },
				{ text: "Cancel", style: "cancel" },
			]);
		} else if (canCamera) {
			await launchCamera();
		} else {
			await launchLibrary();
		}
	};

	const handleSave = async () => {
		if (!brand.trim() || !model.trim() || !horsepower.trim() || !price.trim()) {
			Alert.alert("Missing info", "Please fill in all fields.");
			return;
		}
		const hp = parseInt(horsepower, 10);
		if (isNaN(hp) || hp <= 0) {
			Alert.alert("Invalid horsepower", "Please enter a valid number.");
			return;
		}
		const priceNum = parseFloat(price.replace(/,/g, ""));
		if (isNaN(priceNum) || priceNum < 0) {
			Alert.alert("Invalid price", "Please enter a valid price.");
			return;
		}

		setSaving(true);
		try {
			let imageStorageId: Id<"_storage"> | undefined;
			if (imageUri) {
				const uploadUrl = await generateUploadUrl();
				const imageResponse = await fetch(imageUri);
				const blob = await imageResponse.blob();
				const uploadResponse = await fetch(uploadUrl, {
					method: "POST",
					headers: { "Content-Type": blob.type || "image/jpeg" },
					body: blob,
				});
				const { storageId } = await uploadResponse.json();
				imageStorageId = storageId;
			}

			await addSpottedCar({
				brand: brand.trim(),
				model: model.trim(),
				horsepower: hp,
				spottedDate: new Date().toISOString(),
				price: priceNum,
				imageStorageId,
			});

			setBrand(""); setModel(""); setHorsepower(""); setPrice(""); setImageUri(null);
			onClose();
		} catch {
			Alert.alert("Error", "Failed to save. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	const handleClose = () => {
		setBrand(""); setModel(""); setHorsepower(""); setPrice(""); setImageUri(null);
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
				style={styles.addOverlay}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView
					style={[styles.addSheet, { backgroundColor: isDark ? "#151718" : "#FFFFFF" }]}
					contentContainerStyle={styles.addSheetContent}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<Text style={[styles.addTitle, { color: isDark ? "#ECEDEE" : "#11181C" }]}>
						Spot a Car
					</Text>

					<TouchableOpacity
						style={[styles.photoPicker, { backgroundColor: isDark ? "#1C1C2E" : "#F5F5F8" }]}
						onPress={handlePhoto}
						activeOpacity={0.8}
					>
						{imageUri ? (
							<Image
								source={{ uri: imageUri }}
								style={StyleSheet.absoluteFill}
								contentFit="cover"
							/>
						) : (
							<View style={styles.photoPickerInner}>
								<Text style={styles.photoPickerEmoji}>📷</Text>
								<Text style={[styles.photoPickerHint, { color: isDark ? "#9BA1A6" : "#687076" }]}>
									Tap to take a photo
								</Text>
							</View>
						)}
					</TouchableOpacity>

					<TextInput
						style={inputStyle}
						placeholder="Brand  (e.g. Ferrari)"
						placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
						value={brand}
						onChangeText={setBrand}
						autoCapitalize="words"
					/>
					<TextInput
						style={inputStyle}
						placeholder="Model  (e.g. F40)"
						placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
						value={model}
						onChangeText={setModel}
						autoCapitalize="words"
					/>
					<TextInput
						style={inputStyle}
						placeholder="Horsepower  (e.g. 478)"
						placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
						value={horsepower}
						onChangeText={setHorsepower}
						keyboardType="numeric"
					/>
					<TextInput
						style={inputStyle}
						placeholder="Price  (e.g. 250000)"
						placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
						value={price}
						onChangeText={setPrice}
						keyboardType="numeric"
					/>

					<View style={styles.addBtnRow}>
						<TouchableOpacity style={[styles.addBtn, styles.cancelBtn]} onPress={handleClose}>
							<Text style={[styles.cancelBtnText, { color: isDark ? "#9BA1A6" : "#687076" }]}>
								Cancel
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.addBtn, styles.saveBtn]}
							onPress={handleSave}
							disabled={saving}
						>
							{saving ? (
								<ActivityIndicator color="#FFF" size="small" />
							) : (
								<Text style={styles.saveBtnText}>Add Car</Text>
							)}
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</Modal>
	);
}

// ─── Collection Screen ────────────────────────────────────────────────────────

export default function CollectionScreen() {
	const colorScheme = useColorScheme() ?? "light";
	const isDark = colorScheme === "dark";

	const [selectedCar, setSelectedCar] = useState<SpottedCar | null>(null);
	const [showAdd, setShowAdd] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
	const [sortKey, setSortKey] = useState<SortKey>("date");
	const [sortDir, setSortDir] = useState<SortDir>("desc");

	const cars = useQuery(api.spottedCars.getAllSpotted) as SpottedCar[] | undefined;
	const toggleFavoriteMutation = useMutation(api.spottedCars.toggleFavorite);

	const displayedCars = useMemo(() => {
		if (!cars) return [];
		const q = searchQuery.trim().toLowerCase();
		const filtered = cars.filter((c) => {
			if (showFavoritesOnly && !c.isFavorite) return false;
			if (q) return c.brand.toLowerCase().includes(q) || c.model.toLowerCase().includes(q);
			return true;
		});
		return [...filtered].sort((a, b) => {
			let v = 0;
			if (sortKey === "date")
				v = (a.spottedDate ?? "").localeCompare(b.spottedDate ?? "");
			else if (sortKey === "name")
				v = `${a.brand}${a.model}`.localeCompare(`${b.brand}${b.model}`);
			else if (sortKey === "horsepower")
				v = (a.horsepower ?? 0) - (b.horsepower ?? 0);
			else if (sortKey === "price")
				v = (a.price ?? 0) - (b.price ?? 0);
			return sortDir === "asc" ? v : -v;
		});
	}, [cars, searchQuery, showFavoritesOnly, sortKey, sortDir]);

	const handleSort = (key: SortKey, defaultDir: SortDir) => {
		if (sortKey === key) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortKey(key);
			setSortDir(defaultDir);
		}
	};

	const tint = Colors[colorScheme].tint;

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
					Collection
				</Text>
				{cars !== undefined && (
					<Text style={[styles.headerCount, { color: isDark ? "#9BA1A6" : "#687076" }]}>
						{displayedCars.length}{(searchQuery || showFavoritesOnly) ? ` of ${cars.length}` : ""}{" "}
						{cars.length === 1 ? "car" : "cars"}
					</Text>
				)}
			</View>

			{cars !== undefined && cars.length > 0 && (
				<>
					{/* Search bar */}
					<View style={[styles.searchBarWrap, { backgroundColor: isDark ? "#1C1C2E" : "#EBEBF0" }]}>
						<Ionicons name="search-outline" size={16} color={isDark ? "#9BA1A6" : "#687076"} />
						<TextInput
							style={[styles.searchInput, { color: isDark ? "#ECEDEE" : "#11181C" }]}
							placeholder="Search brand or model..."
							placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
							value={searchQuery}
							onChangeText={setSearchQuery}
							returnKeyType="search"
							autoCapitalize="words"
							clearButtonMode="while-editing"
						/>
					</View>

					{/* Sort bar */}
					<View style={styles.sortBarWrap}>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.sortBar}
					>
						<TouchableOpacity
							style={[
								styles.filterChip,
								showFavoritesOnly
									? { backgroundColor: "transparent", borderColor: tint }
									: { backgroundColor: isDark ? "#1C1C2E" : "#EBEBEB", borderColor: "transparent" },
							]}
							onPress={() => setShowFavoritesOnly((v) => !v)}
						>
							<Text style={[styles.filterChipText, { color: showFavoritesOnly ? tint : isDark ? "#9BA1A6" : "#687076" }]}>
								Favorites
							</Text>
						</TouchableOpacity>
						{SORT_OPTIONS.map(({ key, label, defaultDir }) => {
							const active = sortKey === key;
							return (
								<TouchableOpacity
									key={key}
									style={[
										styles.sortChip,
										{
											backgroundColor: active
												? isDark ? "#1C1C2E" : "#E8E8F0"
												: "transparent",
										},
									]}
									onPress={() => handleSort(key, defaultDir)}
								>
									<Text
										style={[
											styles.sortChipText,
											{ color: active ? tint : isDark ? "#9BA1A6" : "#687076" },
										]}
									>
										{label}
									</Text>
									{active && (
										<Text style={[styles.sortArrow, { color: tint }]}>
											{sortDir === "asc" ? " ↑" : " ↓"}
										</Text>
									)}
								</TouchableOpacity>
							);
						})}
					</ScrollView>
					</View>
				</>
			)}

			{/* Content */}
			{cars === undefined ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" color={tint} />
				</View>
			) : cars.length === 0 ? (
				<View style={styles.centered}>
					<Text style={styles.emptyEmoji}>🏎️</Text>
					<Text style={[styles.emptyTitle, { color: isDark ? "#ECEDEE" : "#11181C" }]}>
						No cars spotted yet
					</Text>
					<Text style={[styles.emptyHint, { color: isDark ? "#9BA1A6" : "#687076" }]}>
						Tap + to log your first spotted car
					</Text>
				</View>
			) : (
				<FlatList
					style={{ flex: 1 }}
					data={displayedCars}
					keyExtractor={(item) => item._id}
					numColumns={2}
					contentContainerStyle={styles.grid}
					columnWrapperStyle={styles.gridRow}
					showsVerticalScrollIndicator={false}
					renderItem={({ item }) => (
						<CarCard car={item} onPress={() => setSelectedCar(item)} onToggleFavorite={() => toggleFavoriteMutation({ id: item._id })} />
					)}
					ListEmptyComponent={
						<View style={[styles.centered, { marginTop: 60 }]}>
							<Ionicons name={showFavoritesOnly ? "star-outline" : "search-outline"} size={40} color={isDark ? "#4A5568" : "#A0AEC0"} />
							<Text style={[styles.emptyTitle, { color: isDark ? "#ECEDEE" : "#11181C" }]}>
								{showFavoritesOnly ? "No favorites yet" : "No results found"}
							</Text>
						</View>
					}
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

			<CarDetailModal
				car={selectedCar}
				visible={selectedCar !== null}
				onClose={() => setSelectedCar(null)}
			/>
			<AddCarModal visible={showAdd} onClose={() => setShowAdd(false)} />
		</SafeAreaView>
	);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	container: { flex: 1 },

	// Header
	header: {
		flexDirection: "row",
		alignItems: "baseline",
		gap: 8,
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 10,
	},
	headerTitle: { fontSize: 28, fontWeight: "700" },
	headerCount: { fontSize: 15 },

	// Search bar
	searchBarWrap: {
		flexDirection: "row",
		alignItems: "center",
		marginHorizontal: 16,
		marginTop: 10,
		marginBottom: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 12,
		gap: 8,
	},
	searchInput: {
		flex: 1,
		fontSize: 14,
		paddingVertical: 0,
	},
	// Favorites chip
	filterChip: {
		paddingHorizontal: 14,
		paddingVertical: 6,
		borderRadius: 20,
		borderWidth: 1.5,
	},
	filterChipText: { fontSize: 13, fontWeight: "600" },

	// Sort bar
	sortBarWrap: { paddingVertical: 4, marginBottom: 8 },
	sortBar: { paddingHorizontal: 16, gap: 4 },
	sortChip: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 5,
		borderRadius: 10,
	},
	sortChipText: { fontSize: 13, fontWeight: "600" },
	sortArrow: { fontSize: 13, fontWeight: "700" },

	// States
	centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
	emptyEmoji: { fontSize: 64, marginBottom: 16 },
	emptyTitle: { fontSize: 20, fontWeight: "600", marginBottom: 8, textAlign: "center" },
	emptyHint: { fontSize: 15, textAlign: "center" },

	// Grid
	grid: { paddingHorizontal: 16, paddingBottom: 120 },
	gridRow: { gap: 16, marginBottom: 16 },

	// Card
	card: {
		width: CARD_WIDTH,
		height: CARD_HEIGHT,
		borderRadius: 18,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.14,
		shadowRadius: 10,
		elevation: 5,
	},
	cardImageWrap: { width: CARD_WIDTH, height: CARD_HEIGHT * 0.64, position: "relative" },
	cardImage: { width: "100%", height: "100%" },
	cardImagePlaceholder: {
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	placeholderEmoji: { fontSize: 40 },
	brandStrip: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		backgroundColor: "rgba(0,0,0,0.52)",
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	brandStripText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
	cardFooter: {
		flex: 1,
		paddingHorizontal: 10,
		paddingVertical: 9,
		justifyContent: "space-between",
	},
	cardModel: { fontSize: 13, fontWeight: "700" },
	cardStats: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
	statPill: { flexDirection: "row", alignItems: "center", gap: 2 },
	statPillEmoji: { fontSize: 10 },
	statPillText: { fontSize: 11, fontWeight: "500" },

	// Star button on card
	starBtn: {
		position: "absolute",
		bottom: 6,
		right: 6,
		width: 26,
		height: 26,
		borderRadius: 13,
		backgroundColor: "rgba(0,0,0,0.4)",
		justifyContent: "center",
		alignItems: "center",
	},

	// FAB
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

	// Detail modal
	detailOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
	detailSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
	detailImageWrap: { width: "100%", height: 280, position: "relative" },
	detailImage: { width: "100%", height: "100%" },
	detailImagePlaceholder: {
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	detailPlaceholderEmoji: { fontSize: 80 },
	closeBtn: {
		position: "absolute",
		top: 16,
		right: 16,
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: "rgba(0,0,0,0.48)",
		justifyContent: "center",
		alignItems: "center",
	},
	closeBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
	detailBody: { padding: 24, paddingBottom: 36 },
	detailBrand: { fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 4 },
	detailModel: { fontSize: 26, fontWeight: "800", marginBottom: 20 },
	divider: { height: 1, marginBottom: 20 },
	statsRow: { flexDirection: "row", justifyContent: "space-around" },
	statItem: { flex: 1, alignItems: "center", gap: 5 },
	statEmoji: { fontSize: 22 },
	statLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2 },
	statValue: { fontSize: 13, fontWeight: "700", textAlign: "center" },
	statDivider: { width: 1, alignSelf: "stretch", marginVertical: 4 },

	// Add modal
	addOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
	addSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "90%" },
	addSheetContent: { padding: 24, paddingBottom: 44 },
	addTitle: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
	photoPicker: { width: "100%", height: 150, borderRadius: 16, overflow: "hidden", marginBottom: 14 },
	photoPickerInner: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
	photoPickerEmoji: { fontSize: 34 },
	photoPickerHint: { fontSize: 14 },
	input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 12 },
	addBtnRow: { flexDirection: "row", gap: 12, marginTop: 4 },
	addBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
	cancelBtn: { backgroundColor: "rgba(128,128,128,0.12)" },
	saveBtn: { backgroundColor: "#0a7ea4" },
	cancelBtnText: { fontSize: 16, fontWeight: "600" },
	saveBtnText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
});
