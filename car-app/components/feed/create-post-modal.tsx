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
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/hooks/use-app-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { styles } from "@/styles/feed";
import { PostType, POST_TYPE_CONFIG } from "./types";
import { PostTypeIcon } from "./post-type-icon";

type Props = {
	visible: boolean;
	onClose: () => void;
};

export function CreatePostModal({ visible, onClose }: Props) {
	const { colors, tint } = useAppTheme();
	const createPost = useMutation(api.posts.createPost);
	const generateUploadUrl = useMutation(api.posts.generateUploadUrl);

	const [step, setStep] = useState<"type" | "details">("type");
	const [postType, setPostType] = useState<PostType>("spotted_car");
	const [imageUri, setImageUri] = useState<string | null>(null);
	const [caption, setCaption] = useState("");
	const [brand, setBrand] = useState("");
	const [model, setModel] = useState("");
	const [title, setTitle] = useState("");
	const [location, setLocation] = useState("");
	const [eventDate, setEventDate] = useState("");
	const [posting, setPosting] = useState(false);
	const [fetchingLocation, setFetchingLocation] = useState(false);

	const typeOptionBg = colors.inputBg;

	const resetForm = () => {
		setStep("type");
		setPostType("spotted_car");
		setImageUri(null);
		setCaption("");
		setBrand("");
		setModel("");
		setTitle("");
		setLocation("");
		setEventDate("");
		setPosting(false);
		setFetchingLocation(false);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	const pickImage = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permission needed", "Please allow photo access in Settings.");
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.85,
		});
		if (!result.canceled) setImageUri(result.assets[0].uri);
	};

	const takePhoto = async () => {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permission needed", "Please allow camera access in Settings.");
			return;
		}
		const result = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.85,
		});
		if (!result.canceled) setImageUri(result.assets[0].uri);
	};

	const fetchLocation = async () => {
		const { status } = await Location.requestForegroundPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permission needed", "Please allow location access in Settings.");
			return;
		}
		setFetchingLocation(true);
		try {
			const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
			const [geo] = await Location.reverseGeocodeAsync({
				latitude: pos.coords.latitude,
				longitude: pos.coords.longitude,
			});
			if (geo) {
				setLocation([geo.city, geo.region, geo.country].filter(Boolean).join(", "));
			}
		} catch {
			Alert.alert("Error", "Could not fetch location.");
		} finally {
			setFetchingLocation(false);
		}
	};

	const handleSubmit = async () => {
		setPosting(true);
		try {
			let imageStorageId: Id<"_storage"> | undefined;
			if (imageUri) {
				const uploadUrl = await generateUploadUrl();
				const blob = await (await fetch(imageUri)).blob();
				const res = await fetch(uploadUrl, {
					method: "POST",
					headers: { "Content-Type": blob.type },
					body: blob,
				});
				const { storageId } = await res.json();
				imageStorageId = storageId;
			}
			await createPost({
				type: postType,
				caption: caption.trim() || undefined,
				imageStorageId,
				brand: brand.trim() || undefined,
				model: model.trim() || undefined,
				title: title.trim() || undefined,
				location: location.trim() || undefined,
				eventDate: eventDate.trim() || undefined,
			});
			handleClose();
		} catch {
			Alert.alert("Error", "Failed to post. Please try again.");
			setPosting(false);
		}
	};

	const typeConfig = POST_TYPE_CONFIG[postType];
	const canSubmit = Boolean(
		postType === "spotted_car"
			? brand.trim() || model.trim() || imageUri || caption.trim()
			: title.trim() || caption.trim()
	);

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
				<View style={[styles.modalSheet, { backgroundColor: colors.modalBg }]}>
					{/* Header */}
					<View style={styles.modalHeader}>
						<TouchableOpacity onPress={step === "details" ? () => setStep("type") : handleClose}>
							<Text style={[styles.modalHeaderAction, { color: colors.textSecondary }]}>
								{step === "details" ? "Back" : "Cancel"}
							</Text>
						</TouchableOpacity>
						<Text style={[styles.modalTitle, { color: colors.textPrimary }]}>New Post</Text>
						{step === "details" ? (
							<TouchableOpacity onPress={handleSubmit} disabled={posting || !canSubmit} activeOpacity={0.7}>
								{posting ? (
									<ActivityIndicator size="small" color={tint} />
								) : (
									<Text
										style={[
											styles.modalHeaderAction,
											{ color: canSubmit ? tint : colors.textSecondary, fontWeight: "700" },
										]}
									>
										Post
									</Text>
								)}
							</TouchableOpacity>
						) : (
							<View style={{ width: 52 }} />
						)}
					</View>

					{step === "type" ? (
						<ScrollView contentContainerStyle={styles.typeStep} showsVerticalScrollIndicator={false}>
							<Text style={[styles.typeStepLabel, { color: colors.textSecondary }]}>
								What are you sharing?
							</Text>
							{(["spotted_car", "car_meet", "photography"] as PostType[]).map((type) => {
								const cfg = POST_TYPE_CONFIG[type];
								const selected = postType === type;
								return (
									<TouchableOpacity
										key={type}
										style={[
											styles.typeOption,
											{
												backgroundColor: selected ? cfg.color + "18" : typeOptionBg,
												borderColor: selected ? cfg.color : "transparent",
											},
										]}
										onPress={() => setPostType(type)}
										activeOpacity={0.8}
									>
										<PostTypeIcon type={type} size={28} color={cfg.color} />
										<View style={{ flex: 1 }}>
											<Text style={[styles.typeOptionLabel, { color: selected ? cfg.color : colors.textPrimary }]}>
												{cfg.label}
											</Text>
											<Text style={[styles.typeOptionDesc, { color: colors.textSecondary }]}>
												{type === "spotted_car"
													? "Share a car you spotted in the wild"
													: type === "car_meet"
													? "Post about a car meet or event"
													: "Announce a photography session"}
											</Text>
										</View>
										{selected ? (
											<View style={[styles.typeCheckmark, { backgroundColor: cfg.color }]}>
												<IconSymbol name="checkmark" size={13} color="#FFFFFF" />
											</View>
										) : null}
									</TouchableOpacity>
								);
							})}
							<TouchableOpacity
								style={[styles.continueBtn, { backgroundColor: tint }]}
								onPress={() => setStep("details")}
								activeOpacity={0.85}
							>
								<Text style={[styles.continueBtnText, { color: colors.iconOnTint }]}>Continue</Text>
							</TouchableOpacity>
						</ScrollView>
					) : (
						<ScrollView
							contentContainerStyle={styles.detailsStep}
							showsVerticalScrollIndicator={false}
							keyboardShouldPersistTaps="handled"
						>
							<View style={[styles.selectedTypePill, { backgroundColor: typeConfig.color + "18" }]}>
								<PostTypeIcon type={postType} size={16} color={typeConfig.color} />
								<Text style={[styles.selectedTypePillLabel, { color: typeConfig.color }]}>
									{typeConfig.label}
								</Text>
							</View>

							{/* Photo picker */}
							<TouchableOpacity
								style={[styles.photoPicker, { backgroundColor: colors.inputBg, borderColor: colors.borderSubtle }]}
								onPress={() =>
									Alert.alert("Add Photo", undefined, [
										{ text: "Take Photo", onPress: takePhoto },
										{ text: "Choose from Library", onPress: pickImage },
										{ text: "Cancel", style: "cancel" },
									])
								}
								activeOpacity={0.8}
							>
								{imageUri ? (
									<Image source={{ uri: imageUri }} style={styles.photoPickerPreview} contentFit="cover" />
								) : (
									<View style={styles.photoPickerEmpty}>
										<IconSymbol name="camera.fill" size={26} color={colors.textSecondary} />
										<Text style={[styles.photoPickerLabel, { color: colors.textSecondary }]}>
											Add Photo (optional)
										</Text>
									</View>
								)}
							</TouchableOpacity>

							{postType === "spotted_car" ? (
								<View style={styles.fieldGroup}>
									<TextInput
										style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
										placeholder="Brand (e.g. Ferrari)"
										placeholderTextColor={colors.textPlaceholder}
										value={brand}
										onChangeText={setBrand}
										autoCapitalize="words"
									/>
									<TextInput
										style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
										placeholder="Model (e.g. 488 Pista)"
										placeholderTextColor={colors.textPlaceholder}
										value={model}
										onChangeText={setModel}
										autoCapitalize="words"
									/>
									<View style={styles.locationRow}>
										<TextInput
											style={[styles.locationInput, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
											placeholder="Location (optional)"
											placeholderTextColor={colors.textPlaceholder}
											value={location}
											onChangeText={setLocation}
											autoCapitalize="words"
										/>
										<TouchableOpacity
											style={[styles.locationBtn, { backgroundColor: colors.subtleBg }]}
											onPress={fetchLocation}
											activeOpacity={0.7}
											disabled={fetchingLocation}
										>
											{fetchingLocation ? (
												<ActivityIndicator size="small" color={tint} />
											) : (
												<Text style={[styles.locationBtnText, { color: tint }]}>📍 Use Current</Text>
											)}
										</TouchableOpacity>
									</View>
								</View>
							) : (
								<View style={styles.fieldGroup}>
									<TextInput
										style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
										placeholder={
											postType === "car_meet"
												? "Event title (e.g. Cars & Coffee LA)"
												: "Session title (e.g. Golden Hour Shoot)"
										}
										placeholderTextColor={colors.textPlaceholder}
										value={title}
										onChangeText={setTitle}
										autoCapitalize="sentences"
									/>
									<TextInput
										style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
										placeholder="Location"
										placeholderTextColor={colors.textPlaceholder}
										value={location}
										onChangeText={setLocation}
										autoCapitalize="words"
									/>
									<TextInput
										style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
										placeholder={
											postType === "car_meet"
												? "Date (e.g. Mar 15, 2025)"
												: "Date & time (e.g. Mar 15 · 6–8 PM)"
										}
										placeholderTextColor={colors.textPlaceholder}
										value={eventDate}
										onChangeText={setEventDate}
									/>
								</View>
							)}

							<TextInput
								style={[styles.input, styles.captionInput, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
								placeholder="Write a caption..."
								placeholderTextColor={colors.textPlaceholder}
								value={caption}
								onChangeText={setCaption}
								multiline
								numberOfLines={3}
								textAlignVertical="top"
							/>
						</ScrollView>
					)}
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}
