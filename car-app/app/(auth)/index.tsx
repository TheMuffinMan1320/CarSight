import React, { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthActions } from "@convex-dev/auth/react";
import { Colors, Fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function SignInScreen() {
	const colorScheme = useColorScheme() ?? "light";
	const isDark = colorScheme === "dark";
	const tint = Colors[colorScheme].tint;
	const bgColor = isDark ? "#0F0F17" : "#F6F6FA";
	const cardBg = isDark ? "#1C1C2E" : "#FFFFFF";

	const { signIn } = useAuthActions();

	const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		setError(null);

		if (!email.trim() || !password.trim()) {
			setError("Please enter your email and password.");
			return;
		}
		if (flow === "signUp" && password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}
		if (password.length < 8) {
			setError("Password must be at least 8 characters.");
			return;
		}

		setLoading(true);
		try {
			await signIn("password", { email: email.trim(), password, flow });
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			if (msg.includes("InvalidSecret") || msg.includes("invalid_secret")) {
				setError("Incorrect email or password.");
			} else if (msg.includes("already") || msg.includes("duplicate")) {
				setError("An account with this email already exists.");
			} else {
				setError("Something went wrong. Please try again.");
			}
		} finally {
			setLoading(false);
		}
	};

	const inputStyle = [
		styles.input,
		{
			backgroundColor: isDark ? "#252538" : "#F5F5F8",
			color: isDark ? "#ECEDEE" : "#11181C",
			borderColor: isDark ? "#2E2E48" : "#E8E8F0",
		},
	];

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView
					contentContainerStyle={styles.scroll}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					{/* Branding */}
					<View style={styles.branding}>
						<Ionicons name="car-sport-outline" size={56} color={tint} style={{ marginBottom: 12 }} />
						<Text
							style={[
								styles.brandName,
								{
									color: isDark ? "#ECEDEE" : "#11181C",
									fontFamily: Fonts?.rounded ?? undefined,
								},
							]}
						>
							CarSight
						</Text>
						<Text style={[styles.brandTagline, { color: isDark ? "#9BA1A6" : "#687076" }]}>
							Log every spot
						</Text>
					</View>

					{/* Card */}
					<View style={[styles.card, { backgroundColor: cardBg }]}>
						{/* Toggle */}
						<View style={[styles.toggle, { backgroundColor: isDark ? "#252538" : "#F0F0F6" }]}>
							<TouchableOpacity
								style={[
									styles.toggleBtn,
									flow === "signIn" && { backgroundColor: cardBg },
								]}
								onPress={() => { setFlow("signIn"); setError(null); }}
								activeOpacity={0.8}
							>
								<Text
									style={[
										styles.toggleText,
										{
											color:
												flow === "signIn"
													? isDark ? "#ECEDEE" : "#11181C"
													: isDark ? "#9BA1A6" : "#687076",
											fontWeight: flow === "signIn" ? "700" : "500",
										},
									]}
								>
									Sign In
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.toggleBtn,
									flow === "signUp" && { backgroundColor: cardBg },
								]}
								onPress={() => { setFlow("signUp"); setError(null); }}
								activeOpacity={0.8}
							>
								<Text
									style={[
										styles.toggleText,
										{
											color:
												flow === "signUp"
													? isDark ? "#ECEDEE" : "#11181C"
													: isDark ? "#9BA1A6" : "#687076",
											fontWeight: flow === "signUp" ? "700" : "500",
										},
									]}
								>
									Create Account
								</Text>
							</TouchableOpacity>
						</View>

						{/* Fields */}
						<View style={styles.fields}>
							<TextInput
								style={inputStyle}
								placeholder="Email"
								placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
								value={email}
								onChangeText={setEmail}
								autoCapitalize="none"
								keyboardType="email-address"
								autoComplete="email"
								returnKeyType="next"
							/>
							<TextInput
								style={inputStyle}
								placeholder="Password"
								placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
								value={password}
								onChangeText={setPassword}
								secureTextEntry
								autoComplete={flow === "signUp" ? "new-password" : "current-password"}
								returnKeyType={flow === "signUp" ? "next" : "done"}
								onSubmitEditing={flow === "signIn" ? handleSubmit : undefined}
							/>
							{flow === "signUp" && (
								<TextInput
									style={inputStyle}
									placeholder="Confirm Password"
									placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
									value={confirmPassword}
									onChangeText={setConfirmPassword}
									secureTextEntry
									autoComplete="new-password"
									returnKeyType="done"
									onSubmitEditing={handleSubmit}
								/>
							)}
						</View>

						{/* Error */}
						{error && (
							<View style={styles.errorBox}>
								<Text style={styles.errorText}>{error}</Text>
							</View>
						)}

						{/* Submit */}
						<TouchableOpacity
							style={[styles.submitBtn, { backgroundColor: "#0a7ea4" }]}
							onPress={handleSubmit}
							disabled={loading}
							activeOpacity={0.85}
						>
							{loading ? (
								<ActivityIndicator color="#FFFFFF" />
							) : (
								<Text style={styles.submitBtnText}>
									{flow === "signIn" ? "Sign In" : "Create Account"}
								</Text>
							)}
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	scroll: {
		flexGrow: 1,
		justifyContent: "center",
		paddingHorizontal: 24,
		paddingVertical: 40,
	},

	branding: {
		alignItems: "center",
		marginBottom: 36,
	},
	brandEmoji: { fontSize: 56, marginBottom: 12 },
	brandName: { fontSize: 34, fontWeight: "800", letterSpacing: -0.5 },
	brandTagline: { fontSize: 16, marginTop: 4 },

	card: {
		borderRadius: 24,
		padding: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 16,
		elevation: 4,
	},

	toggle: {
		flexDirection: "row",
		borderRadius: 14,
		padding: 4,
		marginBottom: 20,
	},
	toggleBtn: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 11,
		alignItems: "center",
	},
	toggleText: { fontSize: 15 },

	fields: { gap: 12 },
	input: {
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		borderWidth: 1,
	},

	errorBox: {
		marginTop: 12,
		backgroundColor: "rgba(255,69,58,0.12)",
		borderRadius: 10,
		padding: 12,
	},
	errorText: { color: "#FF453A", fontSize: 14, textAlign: "center" },

	submitBtn: {
		marginTop: 16,
		paddingVertical: 16,
		borderRadius: 14,
		alignItems: "center",
	},
	submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
