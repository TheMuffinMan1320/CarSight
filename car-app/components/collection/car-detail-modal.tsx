import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Modal,
	TextInput,
	Alert,
	ActivityIndicator,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAppTheme } from "@/hooks/use-app-theme";
import { styles } from "@/styles/collection";
import { SpottedCar } from "./types";

type Props = {
	car: SpottedCar | null;
	visible: boolean;
	onClose: () => void;
};

export function CarDetailModal({ car, visible, onClose }: Props) {
	const { colors, tint } = useAppTheme();
	const updateCar = useMutation(api.spottedCars.updateSpottedCar);
	const deleteCar = useMutation(api.spottedCars.deleteSpottedCar);

	const [editing, setEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [brand, setBrand] = useState("");
	const [model, setModel] = useState("");
	const [horsepower, setHorsepower] = useState("");
	const [price, setPrice] = useState("");
	const [spottedDate, setSpottedDate] = useState("");

	useEffect(() => {
		if (car) {
			setBrand(car.brand);
			setModel(car.model);
			setHorsepower(car.horsepower !== undefined ? String(car.horsepower) : "");
			setPrice(car.price !== undefined ? String(car.price) : "");
			setSpottedDate(car.spottedDate ?? "");
		}
	}, [car]);

	if (!car) return null;

	const formattedDate = car.spottedDate
		? new Date(car.spottedDate).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
		  })
		: "Unknown";

	const formattedPrice = car.price !== undefined ? `$${car.price.toLocaleString()}` : "—";

	const handleDelete = () => {
		Alert.alert("Delete Car", "Remove this car from your collection?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: async () => {
					await deleteCar({ id: car._id }).catch(() =>
						Alert.alert("Error", "Failed to delete.")
					);
					onClose();
				},
			},
		]);
	};

	const handleSave = async () => {
		if (!brand.trim() || !model.trim()) {
			Alert.alert("Missing info", "Brand and model are required.");
			return;
		}
		setSaving(true);
		try {
			await updateCar({
				id: car._id,
				brand: brand.trim(),
				model: model.trim(),
				horsepower: horsepower.trim() ? parseInt(horsepower, 10) : undefined,
				price: price.trim() ? parseFloat(price.replace(/,/g, "")) : undefined,
				spottedDate: spottedDate.trim() || undefined,
			});
			setEditing(false);
		} catch {
			Alert.alert("Error", "Failed to save changes.");
		} finally {
			setSaving(false);
		}
	};

	const inputStyle = [styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary }];

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent
			presentationStyle="overFullScreen"
			onRequestClose={onClose}
		>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<View style={styles.detailOverlay}>
					<View style={[styles.detailSheet, { backgroundColor: colors.modalBg }]}>
						{/* Image */}
						<View style={styles.detailImageWrap}>
							{car.imageUrl ? (
								<Image source={{ uri: car.imageUrl }} style={styles.detailImage} contentFit="cover" />
							) : (
								<View style={[styles.detailImagePlaceholder, { backgroundColor: colors.subtleBg }]}>
									<Ionicons name="car-sport-outline" size={80} color={colors.textPlaceholder} />
								</View>
							)}
							<TouchableOpacity style={styles.closeBtn} onPress={() => { setEditing(false); onClose(); }}>
								<Text style={styles.closeBtnText}>✕</Text>
							</TouchableOpacity>
						</View>

						{editing ? (
							<ScrollView
								contentContainerStyle={{ padding: 20, gap: 10 }}
								keyboardShouldPersistTaps="handled"
								showsVerticalScrollIndicator={false}
							>
								<TextInput style={inputStyle} placeholder="Brand" placeholderTextColor={colors.textPlaceholder} value={brand} onChangeText={setBrand} autoCapitalize="words" />
								<TextInput style={inputStyle} placeholder="Model" placeholderTextColor={colors.textPlaceholder} value={model} onChangeText={setModel} autoCapitalize="words" />
								<TextInput style={inputStyle} placeholder="Horsepower (optional)" placeholderTextColor={colors.textPlaceholder} value={horsepower} onChangeText={setHorsepower} keyboardType="numeric" />
								<TextInput style={inputStyle} placeholder="Price (optional)" placeholderTextColor={colors.textPlaceholder} value={price} onChangeText={setPrice} keyboardType="numeric" />
								<View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
									<TouchableOpacity
										style={[styles.addBtn, styles.cancelBtn, { flex: 1 }]}
										onPress={() => setEditing(false)}
									>
										<Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[styles.addBtn, styles.saveBtn, { flex: 1, backgroundColor: tint }]}
										onPress={handleSave}
										disabled={saving}
									>
										{saving ? (
											<ActivityIndicator color={colors.iconOnTint} size="small" />
										) : (
											<Text style={[styles.saveBtnText, { color: colors.iconOnTint }]}>Save</Text>
										)}
									</TouchableOpacity>
								</View>
							</ScrollView>
						) : (
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

								{/* Actions */}
								<View style={{ flexDirection: "row", gap: 10, paddingTop: 16 }}>
									<TouchableOpacity
										style={[styles.addBtn, { flex: 1, backgroundColor: colors.inputBg }]}
										onPress={() => setEditing(true)}
									>
										<Text style={[styles.cancelBtnText, { color: colors.textPrimary, fontWeight: "600" }]}>Edit</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[styles.addBtn, { flex: 1, backgroundColor: "#FF3B30" + "18" }]}
										onPress={handleDelete}
									>
										<Text style={[styles.cancelBtnText, { color: "#FF3B30", fontWeight: "600" }]}>Delete</Text>
									</TouchableOpacity>
								</View>
							</View>
						)}
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}
