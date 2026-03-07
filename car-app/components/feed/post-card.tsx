import React, { useCallback, useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Alert,
	Pressable,
	Modal,
	TextInput,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/hooks/use-app-theme";
import { styles } from "@/styles/feed";
import { FeedPost, POST_TYPE_CONFIG, timeAgo } from "./types";
import { PostTypeIcon } from "./post-type-icon";

type Props = {
	post: FeedPost;
	onPressUser: (userId: Id<"users">) => void;
	onDelete: (postId: Id<"posts">) => void;
	onPressComment: (postId: Id<"posts">) => void;
};

export function PostCard({ post, onPressUser, onDelete, onPressComment }: Props) {
	const { colors, tint } = useAppTheme();
	const toggleLike = useMutation(api.posts.toggleLike);
	const updatePost = useMutation(api.posts.updatePost);
	const typeConfig = POST_TYPE_CONFIG[post.type];

	const [editing, setEditing] = useState(false);
	const [editCaption, setEditCaption] = useState(post.caption ?? "");
	const [editBrand, setEditBrand] = useState(post.brand ?? "");
	const [editModel, setEditModel] = useState(post.model ?? "");
	const [editTitle, setEditTitle] = useState(post.title ?? "");
	const [editLocation, setEditLocation] = useState(post.location ?? "");
	const [editDate, setEditDate] = useState(post.eventDate ?? "");

	const handleLike = useCallback(() => {
		toggleLike({ postId: post._id });
	}, [post._id]);

	const handleLongPress = useCallback(() => {
		if (!post.isOwnPost) return;
		Alert.alert("Post Options", undefined, [
			{
				text: "Edit",
				onPress: () => {
					setEditCaption(post.caption ?? "");
					setEditBrand(post.brand ?? "");
					setEditModel(post.model ?? "");
					setEditTitle(post.title ?? "");
					setEditLocation(post.location ?? "");
					setEditDate(post.eventDate ?? "");
					setEditing(true);
				},
			},
			{ text: "Delete", style: "destructive", onPress: () => onDelete(post._id) },
			{ text: "Cancel", style: "cancel" },
		]);
	}, [post]);

	const handleSaveEdit = useCallback(async () => {
		await updatePost({
			postId: post._id,
			caption: editCaption.trim() || undefined,
			brand: editBrand.trim() || undefined,
			model: editModel.trim() || undefined,
			title: editTitle.trim() || undefined,
			location: editLocation.trim() || undefined,
			eventDate: editDate.trim() || undefined,
		});
		setEditing(false);
	}, [post._id, editCaption, editBrand, editModel, editTitle, editLocation, editDate]);

	return (
		<Pressable onLongPress={handleLongPress}>
			<View style={[styles.card, { backgroundColor: colors.surface }]}>
				{/* Header */}
				<TouchableOpacity
					style={styles.cardHeader}
					onPress={() => onPressUser(post.userId)}
					activeOpacity={0.7}
				>
					<View style={[styles.avatarCircle, { backgroundColor: colors.avatarBg }]}>
						{post.authorAvatarUrl ? (
							<Image source={{ uri: post.authorAvatarUrl }} style={styles.avatarImg} contentFit="cover" />
						) : (
							<Text style={[styles.avatarInitial, { color: tint }]}>
								{post.authorName.charAt(0).toUpperCase()}
							</Text>
						)}
					</View>
					<View style={styles.headerMeta}>
						<View style={styles.headerNameRow}>
							<Text style={[styles.authorName, { color: colors.textPrimary }]}>
								{post.authorName}
							</Text>
							{post.isPhotographer && (
								<View style={[styles.proBadge, { backgroundColor: colors.photographyBg }]}>
									<View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
										<Ionicons name="camera-outline" size={10} color="#7B2D8B" />
										<Text style={styles.proBadgeText}>Pro</Text>
									</View>
								</View>
							)}
						</View>
						<Text style={[styles.postTime, { color: colors.textSecondary }]}>
							{timeAgo(post._creationTime)}
						</Text>
					</View>
					<View style={[styles.typeBadge, { backgroundColor: typeConfig.color + "20" }]}>
						<PostTypeIcon type={post.type} size={12} color={typeConfig.color} />
						<Text style={[styles.typeBadgeLabel, { color: typeConfig.color }]}>
							{typeConfig.label}
						</Text>
					</View>
				</TouchableOpacity>

				{/* Image */}
				{post.imageUrl ? (
					<Image source={{ uri: post.imageUrl }} style={styles.postImage} contentFit="cover" />
				) : null}

				{/* Meet / Photography event details */}
				{(post.type === "car_meet" || post.type === "photography") &&
				(post.title || post.location || post.eventDate) ? (
					<View style={[styles.eventDetails, { borderColor: colors.separator }]}>
						{post.title ? (
							<Text style={[styles.eventTitle, { color: colors.textPrimary }]}>{post.title}</Text>
						) : null}
						{(post.location || post.eventDate) ? (
							<View style={styles.eventMeta}>
								{post.location ? (
									<Text style={[styles.eventMetaText, { color: colors.textSecondary }]}>
										📍 {post.location}
									</Text>
								) : null}
								{post.eventDate ? (
									<View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
										<Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
										<Text style={[styles.eventMetaText, { color: colors.textSecondary }]}>
											{post.eventDate}
										</Text>
									</View>
								) : null}
							</View>
						) : null}
					</View>
				) : null}

				{/* Car label */}
				{post.type === "spotted_car" && (post.brand || post.model || post.location) ? (
					<View style={styles.carDetails}>
						{(post.brand || post.model) ? (
							<Text style={[styles.carLabel, { color: colors.textPrimary }]}>
								{[post.brand, post.model].filter(Boolean).join(" ")}
							</Text>
						) : null}
						{post.location ? (
							<Text style={[styles.carLocation, { color: colors.textSecondary }]}>
								📍 {post.location}
							</Text>
						) : null}
					</View>
				) : null}

				{/* Actions */}
				<View style={styles.actions}>
					<TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
						<Ionicons
							name={post.isLiked ? "heart" : "heart-outline"}
							size={20}
							color={post.isLiked ? "#E0245E" : colors.textSecondary}
						/>
						{post.likeCount > 0 ? (
							<Text
								style={[
									styles.actionCount,
									{ color: post.isLiked ? "#E0245E" : colors.textSecondary, fontWeight: post.isLiked ? "700" : "500" },
								]}
							>
								{post.likeCount}
							</Text>
						) : null}
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.actionBtn}
						onPress={() => onPressComment(post._id)}
						activeOpacity={0.7}
					>
						<Ionicons name="chatbox-outline" size={20} color={colors.textSecondary} />
						{post.commentCount > 0 ? (
							<Text style={[styles.actionCount, { color: colors.textSecondary }]}>
								{post.commentCount}
							</Text>
						) : null}
					</TouchableOpacity>
				</View>

				{/* Caption */}
				{post.caption ? (
					<View style={styles.captionWrap}>
						<Text style={[styles.captionAuthor, { color: colors.textPrimary }]}>
							{post.authorName}{" "}
						</Text>
						<Text style={[styles.captionText, { color: colors.textPrimary }]}>
							{post.caption}
						</Text>
					</View>
				) : null}
			</View>

			{/* Edit Modal */}
			<Modal visible={editing} animationType="slide" transparent presentationStyle="overFullScreen">
				<KeyboardAvoidingView
					style={{ flex: 1, justifyContent: "flex-end" }}
					behavior={Platform.OS === "ios" ? "padding" : undefined}
				>
					<View style={[styles.modalOverlay, { justifyContent: "flex-end", backgroundColor: "transparent" }]}>
						<View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
							<View style={styles.modalHeader}>
								<TouchableOpacity onPress={() => setEditing(false)}>
									<Text style={[styles.modalHeaderAction, { color: colors.textSecondary }]}>Cancel</Text>
								</TouchableOpacity>
								<Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Post</Text>
								<TouchableOpacity onPress={handleSaveEdit}>
									<Text style={[styles.modalHeaderAction, { color: tint, textAlign: "right", fontWeight: "700" }]}>Save</Text>
								</TouchableOpacity>
							</View>
							<ScrollView style={styles.detailsStep} keyboardShouldPersistTaps="handled">
								{post.type === "spotted_car" && (
									<>
										<TextInput
											style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
											placeholder="Brand"
											placeholderTextColor={colors.textPlaceholder}
											value={editBrand}
											onChangeText={setEditBrand}
										/>
										<TextInput
											style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
											placeholder="Model"
											placeholderTextColor={colors.textPlaceholder}
											value={editModel}
											onChangeText={setEditModel}
										/>
									</>
								)}
								{(post.type === "car_meet" || post.type === "photography") && (
									<>
										<TextInput
											style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
											placeholder="Title"
											placeholderTextColor={colors.textPlaceholder}
											value={editTitle}
											onChangeText={setEditTitle}
										/>
										<TextInput
											style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
											placeholder="Date"
											placeholderTextColor={colors.textPlaceholder}
											value={editDate}
											onChangeText={setEditDate}
										/>
									</>
								)}
								<TextInput
									style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
									placeholder="Location"
									placeholderTextColor={colors.textPlaceholder}
									value={editLocation}
									onChangeText={setEditLocation}
								/>
								<TextInput
									style={[styles.input, styles.captionInput, { backgroundColor: colors.inputBg, color: colors.textPrimary }]}
									placeholder="Caption"
									placeholderTextColor={colors.textPlaceholder}
									value={editCaption}
									onChangeText={setEditCaption}
									multiline
								/>
								<View style={{ height: 24 }} />
							</ScrollView>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</Pressable>
	);
}
