import React, { useState, useMemo } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	TextInput,
	ActivityIndicator,
	ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Fonts } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { styles } from "@/styles/collection";
import { CarCard } from "@/components/collection/car-card";
import { CarDetailModal } from "@/components/collection/car-detail-modal";
import { AddCarModal } from "@/components/collection/add-car-modal";
import { SpottedCar, SortKey, SortDir, SORT_OPTIONS } from "@/components/collection/types";

export default function CollectionScreen() {
	const { colors, tint } = useAppTheme();

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

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.pageBg }]}>
			{/* Header */}
			<View style={styles.header}>
				<Text
					style={[
						styles.headerTitle,
						{ color: colors.textPrimary, fontFamily: Fonts?.rounded ?? undefined },
					]}
				>
					Collection
				</Text>
				{cars !== undefined && (
					<Text style={[styles.headerCount, { color: colors.textSecondary }]}>
						{displayedCars.length}{(searchQuery || showFavoritesOnly) ? ` of ${cars.length}` : ""}{" "}
						{cars.length === 1 ? "car" : "cars"}
					</Text>
				)}
			</View>

			{cars !== undefined && cars.length > 0 && (
				<>
					{/* Search bar */}
					<View style={[styles.searchBarWrap, { backgroundColor: colors.searchBg }]}>
						<Ionicons name="search-outline" size={16} color={colors.textSecondary} />
						<TextInput
							style={[styles.searchInput, { color: colors.textPrimary }]}
							placeholder="Search brand or model..."
							placeholderTextColor={colors.textPlaceholder}
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
										: { backgroundColor: colors.chipBg, borderColor: "transparent" },
								]}
								onPress={() => setShowFavoritesOnly((v) => !v)}
							>
								<Text style={[styles.filterChipText, { color: showFavoritesOnly ? tint : colors.textSecondary }]}>
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
											{ backgroundColor: active ? colors.searchBg : "transparent" },
										]}
										onPress={() => handleSort(key, defaultDir)}
									>
										<Text
											style={[
												styles.sortChipText,
												{ color: active ? tint : colors.textSecondary },
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
					<Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
						No cars spotted yet
					</Text>
					<Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
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
						<CarCard
							car={item}
							onPress={() => setSelectedCar(item)}
							onToggleFavorite={() => toggleFavoriteMutation({ id: item._id })}
						/>
					)}
					ListEmptyComponent={
						<View style={[styles.centered, { marginTop: 60 }]}>
							<Ionicons name={showFavoritesOnly ? "star-outline" : "search-outline"} size={40} color={colors.textPlaceholder} />
							<Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
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
				<IconSymbol name="plus" size={28} color={colors.iconOnTint} />
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
