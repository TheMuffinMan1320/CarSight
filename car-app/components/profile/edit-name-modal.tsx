import React from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Modal,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { useAppTheme } from "@/hooks/use-app-theme";
import { styles } from "@/styles/profile";

type Props = {
	visible: boolean;
	value: string;
	onChange: (text: string) => void;
	onSave: () => void;
	onClose: () => void;
};

export function EditNameModal({ visible, value, onChange, onSave, onClose }: Props) {
	const { colors, tint } = useAppTheme();

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent
			presentationStyle="overFullScreen"
			onRequestClose={onClose}
		>
			<KeyboardAvoidingView
				style={styles.modalOverlay}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<View style={[styles.modalSheet, { backgroundColor: colors.modalBg }]}>
					<Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
						Display Name
					</Text>
					<TextInput
						style={[
							styles.modalInput,
							{ backgroundColor: colors.inputBg, color: colors.textPrimary },
						]}
						placeholder="Your name"
						placeholderTextColor={colors.textPlaceholder}
						value={value}
						onChangeText={onChange}
						autoCapitalize="words"
						autoFocus
						returnKeyType="done"
						onSubmitEditing={onSave}
					/>
					<View style={styles.modalBtnRow}>
						<TouchableOpacity
							style={[styles.modalBtn, styles.cancelBtn]}
							onPress={onClose}
						>
							<Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
								Cancel
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.modalBtn, styles.saveBtn, { backgroundColor: tint }]}
							onPress={onSave}
						>
							<Text style={[styles.saveBtnText, { color: colors.iconOnTint }]}>
								Save
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}
