import React, { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	TextInput,
	Alert,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Pressable,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/hooks/use-app-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { styles } from "@/styles/feed";
import { timeAgo } from "./types";

type Props = {
	postId: Id<"posts">;
	onClose: () => void;
};

export function CommentsSheet({ postId, onClose }: Props) {
	const { colors, tint } = useAppTheme();
	const comments = useQuery(api.comments.getComments, { postId });
	const addComment = useMutation(api.comments.addComment);
	const deleteComment = useMutation(api.comments.deleteComment);

	const [text, setText] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async () => {
		const trimmed = text.trim();
		if (!trimmed) return;
		setSubmitting(true);
		try {
			await addComment({ postId, text: trimmed });
			setText("");
		} catch {
			Alert.alert("Error", "Failed to post comment.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleLongPressComment = (commentId: Id<"comments">, isOwn: boolean) => {
		if (!isOwn) return;
		Alert.alert("Delete Comment", "Remove this comment?", [
			{ text: "Cancel", style: "cancel" },
			{ text: "Delete", style: "destructive", onPress: () => deleteComment({ commentId }) },
		]);
	};

	return (
		<KeyboardAvoidingView
			style={[styles.commentsSheet, { backgroundColor: colors.pageBg }]}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<View style={styles.sheetHandle}>
				<View style={[styles.handleBar, { backgroundColor: colors.switchTrackOff }]} />
			</View>
			<View style={[styles.commentsHeader, { borderBottomColor: colors.searchBg }]}>
				<Text style={[styles.commentsTitle, { color: colors.textPrimary }]}>Comments</Text>
				<TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
					<IconSymbol name="xmark.circle.fill" size={26} color={colors.iconInactive} />
				</TouchableOpacity>
			</View>

			{comments === undefined ? (
				<ActivityIndicator color={tint} style={{ flex: 1, alignSelf: "center", marginTop: 32 }} />
			) : comments.length === 0 ? (
				<View style={styles.commentsEmpty}>
					<Ionicons name="chatbox-outline" size={40} color={colors.textSecondary} />
					<Text style={[styles.commentsEmptyText, { color: colors.textSecondary }]}>
						No comments yet — be the first!
					</Text>
				</View>
			) : (
				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={styles.commentsList}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					{comments.map((comment) => (
						<Pressable
							key={comment._id}
							onLongPress={() => handleLongPressComment(comment._id, comment.isOwnComment)}
						>
							<View style={styles.commentRow}>
								<View style={[styles.commentAvatar, { backgroundColor: colors.avatarBg }]}>
									{comment.authorAvatarUrl ? (
										<Image
											source={{ uri: comment.authorAvatarUrl }}
											style={styles.commentAvatarImg}
											contentFit="cover"
										/>
									) : (
										<Text style={[styles.commentAvatarInitial, { color: tint }]}>
											{comment.authorName.charAt(0).toUpperCase()}
										</Text>
									)}
								</View>
								<View style={[styles.commentBubble, { backgroundColor: colors.surface }]}>
									<View style={styles.commentBubbleHeader}>
										<Text style={[styles.commentAuthor, { color: colors.textPrimary }]}>
											{comment.authorName}
										</Text>
										<Text style={[styles.commentTime, { color: colors.textSecondary }]}>
											{timeAgo(comment._creationTime)}
										</Text>
									</View>
									<Text style={[styles.commentText, { color: colors.textPrimary }]}>
										{comment.text}
									</Text>
								</View>
							</View>
						</Pressable>
					))}
				</ScrollView>
			)}

			<View style={[styles.commentInputRow, { backgroundColor: colors.pageBg, borderTopColor: colors.searchBg }]}>
				<TextInput
					style={[styles.commentInput, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
					placeholder="Add a comment..."
					placeholderTextColor={colors.textPlaceholder}
					value={text}
					onChangeText={setText}
					multiline
					maxLength={500}
					returnKeyType="default"
				/>
				<TouchableOpacity
					style={[
						styles.commentSendBtn,
						{ backgroundColor: text.trim() && !submitting ? tint : colors.borderSubtle },
					]}
					onPress={handleSubmit}
					disabled={!text.trim() || submitting}
					activeOpacity={0.8}
				>
					{submitting ? (
						<ActivityIndicator size="small" color={colors.iconOnTint} />
					) : (
						<IconSymbol
							name="arrow.up"
							size={18}
							color={text.trim() ? colors.iconOnTint : colors.textSecondary}
						/>
					)}
				</TouchableOpacity>
			</View>
		</KeyboardAvoidingView>
	);
}
