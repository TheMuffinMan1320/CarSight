import React, { useState } from "react";
import {
	Modal,
	View,
	Text,
	TextInput,
	TouchableOpacity,
	FlatList,
	Pressable,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/hooks/use-app-theme";
import { styles } from "@/styles/feed";

type Props = {
	visible: boolean;
	onClose: () => void;
	onPressUser: (userId: Id<"users">) => void;
};

type UserResult = {
	userId: string;
	displayName: string;
	isPhotographer: boolean;
	imageUrl: string | null;
};

function UserRow({ item, tint, colors, onPress }: { item: UserResult; tint: string; colors: any; onPress: () => void }) {
	return (
		<TouchableOpacity
			style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 11 }}
			onPress={onPress}
			activeOpacity={0.7}
		>
			<View style={[styles.avatarCircle, { backgroundColor: colors.avatarBg }]}>
				{item.imageUrl ? (
					<Image source={{ uri: item.imageUrl }} style={styles.avatarImg} contentFit="cover" />
				) : (
					<Text style={[styles.avatarInitial, { color: tint }]}>
						{item.displayName.charAt(0).toUpperCase()}
					</Text>
				)}
			</View>
			<View style={{ flex: 1 }}>
				<Text style={{ fontSize: 15, fontWeight: "600", color: colors.textPrimary }}>
					{item.displayName}
				</Text>
				{item.isPhotographer && (
					<Text style={{ fontSize: 12, color: "#7B2D8B", marginTop: 1 }}>Photographer</Text>
				)}
			</View>
			<Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
		</TouchableOpacity>
	);
}

export function UserSearchModal({ visible, onClose, onPressUser }: Props) {
	const { colors, tint } = useAppTheme();
	const [query, setQuery] = useState("");

	const suggested = useQuery(api.userProfile.getSuggestedUsers);
	const searchResults = useQuery(api.userProfile.searchUsers, { query });

	const isSearching = query.trim().length > 0;
	const data: UserResult[] = isSearching ? (searchResults ?? []) : (suggested ?? []);
	const loading = isSearching ? searchResults === undefined : suggested === undefined;

	const handlePressUser = (userId: string) => {
		setQuery("");
		onClose();
		onPressUser(userId as Id<"users">);
	};

	const handleClose = () => {
		setQuery("");
		onClose();
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent
			presentationStyle="overFullScreen"
			onRequestClose={handleClose}
		>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<View style={styles.profileModalOverlay}>
					<Pressable style={styles.profileModalBackdrop} onPress={handleClose} />
					<View style={[styles.profileSheet, { backgroundColor: colors.surface }]}>
						<View style={styles.sheetHandle}>
							<View style={[styles.handleBar, { backgroundColor: colors.separator }]} />
						</View>

						{/* Search Input */}
						<View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 12 }}>
							<View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.inputBg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
								<Ionicons name="search-outline" size={16} color={colors.textSecondary} />
								<TextInput
									style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}
									placeholder="Search users..."
									placeholderTextColor={colors.textPlaceholder}
									value={query}
									onChangeText={setQuery}
									autoFocus
									autoCapitalize="none"
									returnKeyType="search"
								/>
								{query.length > 0 && (
									<TouchableOpacity onPress={() => setQuery("")}>
										<Ionicons name="close-circle" size={16} color={colors.textSecondary} />
									</TouchableOpacity>
								)}
							</View>
							<TouchableOpacity onPress={handleClose}>
								<Text style={{ fontSize: 15, color: tint, fontWeight: "600" }}>Cancel</Text>
							</TouchableOpacity>
						</View>

						{/* Section label */}
						{!isSearching && (
							<Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1, color: colors.textSecondary, paddingHorizontal: 16, paddingBottom: 4 }}>
								SUGGESTED
							</Text>
						)}

						{/* Results */}
						{loading ? (
							<ActivityIndicator color={tint} style={{ paddingVertical: 32 }} />
						) : isSearching && data.length === 0 ? (
							<Text style={{ textAlign: "center", paddingVertical: 32, fontSize: 14, color: colors.textSecondary }}>
								No users found
							</Text>
						) : (
							<FlatList
								data={data}
								keyExtractor={(item) => item.userId}
								keyboardShouldPersistTaps="handled"
								renderItem={({ item }) => (
									<UserRow
										item={item}
										tint={tint}
										colors={colors}
										onPress={() => handlePressUser(item.userId)}
									/>
								)}
							/>
						)}
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}
