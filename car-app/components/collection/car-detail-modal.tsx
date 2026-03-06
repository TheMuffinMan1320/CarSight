import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/use-app-theme";
import { styles } from "@/styles/collection";
import { SpottedCar } from "./types";

type Props = {
	car: SpottedCar | null;
	visible: boolean;
	onClose: () => void;
};

export function CarDetailModal({ car, visible, onClose }: Props) {
	const { colors } = useAppTheme();

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
				<View style={[styles.detailSheet, { backgroundColor: colors.modalBg }]}>
					<View style={styles.detailImageWrap}>
						{car.imageUrl ? (
							<Image
								source={{ uri: car.imageUrl }}
								style={styles.detailImage}
								contentFit="cover"
							/>
						) : (
							<View style={[styles.detailImagePlaceholder, { backgroundColor: colors.subtleBg }]}>
								<Ionicons name="car-sport-outline" size={80} color={colors.textPlaceholder} />
							</View>
						)}
						<TouchableOpacity style={styles.closeBtn} onPress={onClose}>
							<Text style={styles.closeBtnText}>✕</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.detailBody}>
						<Text style={[styles.detailBrand, { color: colors.textSecondary }]}>
							{car.brand.toUpperCase()}
						</Text>
						<Text style={[styles.detailModel, { color: colors.textPrimary }]}>
							{car.model}
						</Text>

						<View style={[styles.divider, { backgroundColor: colors.divider }]} />

						<View style={styles.statsRow}>
							<View style={styles.statItem}>
								<Ionicons name="calendar-outline" size={22} color={colors.textSecondary} />
								<Text style={[styles.statLabel, { color: colors.textSecondary }]}>SPOTTED</Text>
								<Text style={[styles.statValue, { color: colors.textPrimary }]}>{formattedDate}</Text>
							</View>

							<View style={[styles.statDivider, { backgroundColor: colors.divider }]} />

							<View style={styles.statItem}>
								<Ionicons name="flash-outline" size={22} color={colors.textSecondary} />
								<Text style={[styles.statLabel, { color: colors.textSecondary }]}>POWER</Text>
								<Text style={[styles.statValue, { color: colors.textPrimary }]}>
									{car.horsepower !== undefined ? `${car.horsepower} HP` : "—"}
								</Text>
							</View>

							<View style={[styles.statDivider, { backgroundColor: colors.divider }]} />

							<View style={styles.statItem}>
								<Ionicons name="pricetag-outline" size={22} color={colors.textSecondary} />
								<Text style={[styles.statLabel, { color: colors.textSecondary }]}>PRICE</Text>
								<Text style={[styles.statValue, { color: colors.textPrimary }]}>{formattedPrice}</Text>
							</View>
						</View>
					</View>
				</View>
			</View>
		</Modal>
	);
}
