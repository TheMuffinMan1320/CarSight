import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, Alert, Pressable } from "react-native";
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
	const typeConfig = POST_TYPE_CONFIG[post.type];

	const handleLike = useCallback(() => {
		toggleLike({ postId: post._id });
	}, [post._id]);

	const handleLongPress = useCallback(() => {
		if (!post.isOwnPost) return;
		Alert.alert("Delete Post", "Remove this post?", [
			{ text: "Cancel", style: "cancel" },
			{ text: "Delete", style: "destructive", onPress: () => onDelete(post._id) },
		]);
	}, [post._id, post.isOwnPost]);

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
		</Pressable>
	);
}
