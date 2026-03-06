import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/use-app-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { styles } from "@/styles/watchlist";
import { WatchItem, getBrandLogoUrl } from "./types";

type Props = {
	item: WatchItem;
	onDelete: () => void;
};

export function WatchRow({ item, onDelete }: Props) {
	const { colors } = useAppTheme();
	const [logoError, setLogoError] = useState(false);
	const handleLogoError = useCallback(() => setLogoError(true), []);

	return (
		<View style={[styles.row, { backgroundColor: colors.surface }]}>
			<View style={[styles.rowIcon, { backgroundColor: colors.subtleBg }]}>
				{!logoError ? (
					<Image
						source={{ uri: getBrandLogoUrl(item.brand) }}
						style={styles.brandLogo}
						contentFit="contain"
						onError={handleLogoError}
					/>
				) : (
					<Ionicons name="car-sport-outline" size={22} color={colors.textSecondary} />
				)}
			</View>
			<View style={styles.rowText}>
				<Text style={[styles.rowBrand, { color: colors.textSecondary }]}>
					{item.brand.toUpperCase()}
				</Text>
				<Text style={[styles.rowModel, { color: colors.textPrimary }]}>
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
