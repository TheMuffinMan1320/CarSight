import React, { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Modal,
	TextInput,
	Alert,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/hooks/use-app-theme";
import { styles } from "@/styles/collection";

type Props = {
	visible: boolean;
	onClose: () => void;
};

export function AddCarModal({ visible, onClose }: Props) {
	const { colors, tint } = useAppTheme();

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
		{ backgroundColor: colors.inputBg, color: colors.textPrimary },
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
					style={[styles.addSheet, { backgroundColor: colors.modalBg }]}
					contentContainerStyle={styles.addSheetContent}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					<Text style={[styles.addTitle, { color: colors.textPrimary }]}>
						Spot a Car
					</Text>

					<TouchableOpacity
						style={[styles.photoPicker, { backgroundColor: colors.inputBg }]}
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
								<Text style={[styles.photoPickerHint, { color: colors.textSecondary }]}>
									Tap to take a photo
								</Text>
							</View>
						)}
					</TouchableOpacity>

					<TextInput
						style={inputStyle}
						placeholder="Brand  (e.g. Ferrari)"
						placeholderTextColor={colors.textPlaceholder}
						value={brand}
						onChangeText={setBrand}
						autoCapitalize="words"
					/>
					<TextInput
						style={inputStyle}
						placeholder="Model  (e.g. F40)"
						placeholderTextColor={colors.textPlaceholder}
						value={model}
						onChangeText={setModel}
						autoCapitalize="words"
					/>
					<TextInput
						style={inputStyle}
						placeholder="Horsepower  (e.g. 478)"
						placeholderTextColor={colors.textPlaceholder}
						value={horsepower}
						onChangeText={setHorsepower}
						keyboardType="numeric"
					/>
					<TextInput
						style={inputStyle}
						placeholder="Price  (e.g. 250000)"
						placeholderTextColor={colors.textPlaceholder}
						value={price}
						onChangeText={setPrice}
						keyboardType="numeric"
					/>

					<View style={styles.addBtnRow}>
						<TouchableOpacity style={[styles.addBtn, styles.cancelBtn]} onPress={handleClose}>
							<Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
								Cancel
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.addBtn, styles.saveBtn, { backgroundColor: tint }]}
							onPress={handleSave}
							disabled={saving}
						>
							{saving ? (
								<ActivityIndicator color={colors.iconOnTint} size="small" />
							) : (
								<Text style={[styles.saveBtnText, { color: colors.iconOnTint }]}>Add Car</Text>
							)}
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</Modal>
	);
}
