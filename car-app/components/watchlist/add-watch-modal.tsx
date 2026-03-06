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
} from "react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAppTheme } from "@/hooks/use-app-theme";
import { styles } from "@/styles/watchlist";

type Props = {
	visible: boolean;
	onClose: () => void;
};

export function AddWatchModal({ visible, onClose }: Props) {
	const { colors, tint } = useAppTheme();
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
				style={styles.modalOverlay}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<View style={[styles.modalSheet, { backgroundColor: colors.modalBg }]}>
					<Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
						Add to Watchlist
					</Text>
					<TextInput
						style={inputStyle}
						placeholder="Brand  (e.g. Ferrari)"
						placeholderTextColor={colors.textPlaceholder}
						value={brand}
						onChangeText={setBrand}
						autoCapitalize="words"
						autoFocus
					/>
					<TextInput
						style={inputStyle}
						placeholder="Model  (e.g. F40)"
						placeholderTextColor={colors.textPlaceholder}
						value={model}
						onChangeText={setModel}
						autoCapitalize="words"
					/>
					<View style={styles.modalBtnRow}>
						<TouchableOpacity
							style={[styles.modalBtn, styles.cancelBtn]}
							onPress={handleClose}
						>
							<Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
								Cancel
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.modalBtn, styles.saveBtn, { backgroundColor: tint }]}
							onPress={handleSave}
							disabled={saving}
						>
							{saving ? (
								<ActivityIndicator color={colors.iconOnTint} size="small" />
							) : (
								<Text style={[styles.saveBtnText, { color: colors.iconOnTint }]}>Add</Text>
							)}
						</TouchableOpacity>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}
