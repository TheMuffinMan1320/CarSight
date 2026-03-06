import React from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/use-app-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { styles } from "@/styles/collection";
import { SpottedCar, formatPriceCompact } from "./types";

type Props = {
	car: SpottedCar;
	onPress: () => void;
	onToggleFavorite: () => void;
};

export function CarCard({ car, onPress, onToggleFavorite }: Props) {
	const { colors } = useAppTheme();

	return (
		<Pressable
			style={[styles.card, { backgroundColor: colors.surface }]}
			onPress={onPress}
			android_ripple={{ color: "rgba(0,0,0,0.08)" }}
		>
			<View style={styles.cardImageWrap}>
				{car.imageUrl ? (
					<Image source={{ uri: car.imageUrl }} style={styles.cardImage} contentFit="cover" />
				) : (
					<View style={[styles.cardImagePlaceholder, { backgroundColor: colors.subtleBg }]}>
						<Ionicons name="car-sport-outline" size={40} color={colors.textPlaceholder} />
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

			<View style={[styles.cardFooter, { backgroundColor: colors.surface }]}>
				<Text style={[styles.cardModel, { color: colors.textPrimary }]} numberOfLines={1}>
					{car.model}
				</Text>
				<View style={styles.cardStats}>
					{car.horsepower !== undefined && (
						<View style={styles.statPill}>
							<Ionicons name="flash-outline" size={10} color={colors.textSecondary} />
							<Text style={[styles.statPillText, { color: colors.textSecondary }]}>
								{car.horsepower}
							</Text>
						</View>
					)}
					{car.price !== undefined && (
						<View style={styles.statPill}>
							<Ionicons name="pricetag-outline" size={10} color={colors.textSecondary} />
							<Text style={[styles.statPillText, { color: colors.textSecondary }]}>
								{formatPriceCompact(car.price)}
							</Text>
						</View>
					)}
				</View>
			</View>
		</Pressable>
	);
}
