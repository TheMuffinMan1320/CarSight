import React, { useState } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Fonts } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { styles } from "@/styles/watchlist";
import { WatchRow } from "@/components/watchlist/watch-row";
import { AddWatchModal } from "@/components/watchlist/add-watch-modal";
import { WatchItem } from "@/components/watchlist/types";

export default function WatchlistScreen() {
	const { colors, tint } = useAppTheme();

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
		<SafeAreaView style={[styles.container, { backgroundColor: colors.pageBg }]}>
			{/* Header */}
			<View style={styles.header}>
				<Text
					style={[
						styles.headerTitle,
						{ color: colors.textPrimary, fontFamily: Fonts?.rounded ?? undefined },
					]}
				>
					Watchlist
				</Text>
				{items !== undefined && items.length > 0 && (
					<Text style={[styles.headerCount, { color: colors.textSecondary }]}>
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
					<Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
						Your watchlist is empty
					</Text>
					<Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
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
						<View style={[styles.separator, { backgroundColor: colors.separator }]} />
					)}
					renderItem={({ item }) => (
						<WatchRow item={item} onDelete={() => handleDelete(item._id)} />
					)}
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

			<AddWatchModal visible={showAdd} onClose={() => setShowAdd(false)} />
		</SafeAreaView>
	);
}
