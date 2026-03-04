import React, { useState, useCallback } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	Modal,
	TextInput,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	ActivityIndicator,
	Alert,
	Pressable,
	Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import PhotographerCalendar from "@/components/photographer-calendar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type PostType = "spotted_car" | "car_meet" | "photography";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ms: number) {
	const diff = Date.now() - ms;
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d`;
	return `${Math.floor(days / 7)}w`;
}

const POST_TYPE_CONFIG = {
	spotted_car: { label: "Car Spot", icon: "🚗", color: "#0a7ea4" },
	car_meet: { label: "Car Meet", icon: "🏁", color: "#E85D04" },
	photography: { label: "Photography", icon: "📸", color: "#7B2D8B" },
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type FeedPost = {
	_id: Id<"posts">;
	userId: Id<"users">;
	type: PostType;
	caption?: string;
	imageUrl: string | null;
	brand?: string;
	model?: string;
	title?: string;
	location?: string;
	eventDate?: string;
	authorName: string;
	authorAvatarUrl: string | null;
	isPhotographer: boolean;
	likeCount: number;
	commentCount: number;
	isLiked: boolean;
	isOwnPost: boolean;
	_creationTime: number;
};

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
	post,
	isDark,
	tint,
	onPressUser,
	onDelete,
	onPressComment,
}: {
	post: FeedPost;
	isDark: boolean;
	tint: string;
	onPressUser: (userId: Id<"users">) => void;
	onDelete: (postId: Id<"posts">) => void;
	onPressComment: (postId: Id<"posts">) => void;
}) {
	const toggleLike = useMutation(api.posts.toggleLike);
	const typeConfig = POST_TYPE_CONFIG[post.type];
	const cardBg = isDark ? "#1C1C2E" : "#FFFFFF";
	const textPrimary = isDark ? "#ECEDEE" : "#11181C";
	const textSecondary = isDark ? "#9BA1A6" : "#687076";

	const handleLike = useCallback(() => {
		toggleLike({ postId: post._id });
	}, [post._id]);

	const handleLongPress = useCallback(() => {
		if (!post.isOwnPost) return;
		Alert.alert("Delete Post", "Remove this post?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => onDelete(post._id),
			},
		]);
	}, [post._id, post.isOwnPost]);

	return (
		<Pressable onLongPress={handleLongPress}>
			<View style={[styles.card, { backgroundColor: cardBg }]}>
				{/* Header */}
				<TouchableOpacity
					style={styles.cardHeader}
					onPress={() => onPressUser(post.userId)}
					activeOpacity={0.7}
				>
					<View
						style={[
							styles.avatarCircle,
							{ backgroundColor: isDark ? "#252538" : "#E8E8F0" },
						]}
					>
						{post.authorAvatarUrl ? (
							<Image
								source={{ uri: post.authorAvatarUrl }}
								style={styles.avatarImg}
								contentFit="cover"
							/>
						) : (
							<Text style={[styles.avatarInitial, { color: tint }]}>
								{post.authorName.charAt(0).toUpperCase()}
							</Text>
						)}
					</View>
					<View style={styles.headerMeta}>
						<View style={styles.headerNameRow}>
							<Text style={[styles.authorName, { color: textPrimary }]}>
								{post.authorName}
							</Text>
							{post.isPhotographer && (
								<View
									style={[
										styles.proBadge,
										{ backgroundColor: isDark ? "#2A1A3E" : "#F3E8FF" },
									]}
								>
									<Text style={styles.proBadgeText}>📸 Pro</Text>
								</View>
							)}
						</View>
						<Text style={[styles.postTime, { color: textSecondary }]}>
							{timeAgo(post._creationTime)}
						</Text>
					</View>
					<View
						style={[
							styles.typeBadge,
							{ backgroundColor: typeConfig.color + "20" },
						]}
					>
						<Text style={styles.typeBadgeIcon}>{typeConfig.icon}</Text>
						<Text style={[styles.typeBadgeLabel, { color: typeConfig.color }]}>
							{typeConfig.label}
						</Text>
					</View>
				</TouchableOpacity>

				{/* Image */}
				{post.imageUrl ? (
					<Image
						source={{ uri: post.imageUrl }}
						style={styles.postImage}
						contentFit="cover"
					/>
				) : null}

				{/* Meet / Photography event details */}
				{(post.type === "car_meet" || post.type === "photography") &&
				(post.title || post.location || post.eventDate) ? (
					<View
						style={[
							styles.eventDetails,
							{ borderColor: isDark ? "#252538" : "#F0F0F4" },
						]}
					>
						{post.title ? (
							<Text style={[styles.eventTitle, { color: textPrimary }]}>
								{post.title}
							</Text>
						) : null}
						{(post.location || post.eventDate) ? (
							<View style={styles.eventMeta}>
								{post.location ? (
									<Text style={[styles.eventMetaText, { color: textSecondary }]}>
										📍 {post.location}
									</Text>
								) : null}
								{post.eventDate ? (
									<Text style={[styles.eventMetaText, { color: textSecondary }]}>
										📅 {post.eventDate}
									</Text>
								) : null}
							</View>
						) : null}
					</View>
				) : null}

				{/* Car label */}
				{post.type === "spotted_car" && (post.brand || post.model) ? (
					<View style={styles.carDetails}>
						<Text style={[styles.carLabel, { color: textPrimary }]}>
							{[post.brand, post.model].filter(Boolean).join(" ")}
						</Text>
					</View>
				) : null}

				{/* Actions */}
				<View style={styles.actions}>
					<TouchableOpacity
						style={styles.actionBtn}
						onPress={handleLike}
						activeOpacity={0.7}
					>
						<Text style={styles.likeIcon}>{post.isLiked ? "❤️" : "🤍"}</Text>
						{post.likeCount > 0 ? (
							<Text
								style={[
									styles.actionCount,
									{
										color: post.isLiked ? "#E0245E" : textSecondary,
										fontWeight: post.isLiked ? "700" : "500",
									},
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
						<Text style={styles.commentIcon}>💬</Text>
						{post.commentCount > 0 ? (
							<Text style={[styles.actionCount, { color: textSecondary }]}>
								{post.commentCount}
							</Text>
						) : null}
					</TouchableOpacity>
				</View>

				{/* Caption */}
				{post.caption ? (
					<View style={styles.captionWrap}>
						<Text style={[styles.captionAuthor, { color: textPrimary }]}>
							{post.authorName}{" "}
						</Text>
						<Text style={[styles.captionText, { color: textPrimary }]}>
							{post.caption}
						</Text>
					</View>
				) : null}
			</View>
		</Pressable>
	);
}

// ─── Comments Sheet ───────────────────────────────────────────────────────────

function CommentsSheet({
	postId,
	isDark,
	tint,
	onClose,
}: {
	postId: Id<"posts">;
	isDark: boolean;
	tint: string;
	onClose: () => void;
}) {
	const comments = useQuery(api.comments.getComments, { postId });
	const addComment = useMutation(api.comments.addComment);
	const deleteComment = useMutation(api.comments.deleteComment);

	const [text, setText] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const bgColor = isDark ? "#0F0F17" : "#F6F6FA";
	const cardBg = isDark ? "#1C1C2E" : "#FFFFFF";
	const textPrimary = isDark ? "#ECEDEE" : "#11181C";
	const textSecondary = isDark ? "#9BA1A6" : "#687076";
	const inputBg = isDark ? "#252538" : "#F0F0F6";

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

	const handleLongPressComment = (
		commentId: Id<"comments">,
		isOwn: boolean
	) => {
		if (!isOwn) return;
		Alert.alert("Delete Comment", "Remove this comment?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => deleteComment({ commentId }),
			},
		]);
	};

	return (
		<KeyboardAvoidingView
			style={[styles.commentsSheet, { backgroundColor: bgColor }]}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			{/* Handle + header */}
			<View style={styles.sheetHandle}>
				<View
					style={[
						styles.handleBar,
						{ backgroundColor: isDark ? "#3A3A4E" : "#D1D1D6" },
					]}
				/>
			</View>
			<View
				style={[
					styles.commentsHeader,
					{ borderBottomColor: isDark ? "#252538" : "#EBEBF0" },
				]}
			>
				<Text style={[styles.commentsTitle, { color: textPrimary }]}>
					Comments
				</Text>
				<TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
					<IconSymbol
						name="xmark.circle.fill"
						size={26}
						color={isDark ? "#3A3A4E" : "#C7C7CC"}
					/>
				</TouchableOpacity>
			</View>

			{/* Comment list */}
			{comments === undefined ? (
				<ActivityIndicator color={tint} style={{ flex: 1, alignSelf: "center", marginTop: 32 }} />
			) : comments.length === 0 ? (
				<View style={styles.commentsEmpty}>
					<Text style={styles.commentsEmptyIcon}>💬</Text>
					<Text style={[styles.commentsEmptyText, { color: textSecondary }]}>
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
							onLongPress={() =>
								handleLongPressComment(comment._id, comment.isOwnComment)
							}
						>
							<View style={styles.commentRow}>
								<View
									style={[
										styles.commentAvatar,
										{ backgroundColor: isDark ? "#252538" : "#E8E8F0" },
									]}
								>
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
								<View
									style={[
										styles.commentBubble,
										{ backgroundColor: cardBg },
									]}
								>
									<View style={styles.commentBubbleHeader}>
										<Text style={[styles.commentAuthor, { color: textPrimary }]}>
											{comment.authorName}
										</Text>
										<Text style={[styles.commentTime, { color: textSecondary }]}>
											{timeAgo(comment._creationTime)}
										</Text>
									</View>
									<Text style={[styles.commentText, { color: textPrimary }]}>
										{comment.text}
									</Text>
								</View>
							</View>
						</Pressable>
					))}
				</ScrollView>
			)}

			{/* Input */}
			<View
				style={[
					styles.commentInputRow,
					{
						backgroundColor: bgColor,
						borderTopColor: isDark ? "#252538" : "#EBEBF0",
					},
				]}
			>
				<TextInput
					style={[
						styles.commentInput,
						{ backgroundColor: inputBg, color: textPrimary },
					]}
					placeholder="Add a comment..."
					placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
					value={text}
					onChangeText={setText}
					multiline
					maxLength={500}
					returnKeyType="default"
				/>
				<TouchableOpacity
					style={[
						styles.commentSendBtn,
						{
							backgroundColor:
								text.trim() && !submitting ? tint : isDark ? "#252538" : "#E0E0E8",
						},
					]}
					onPress={handleSubmit}
					disabled={!text.trim() || submitting}
					activeOpacity={0.8}
				>
					{submitting ? (
						<ActivityIndicator
							size="small"
							color={isDark ? "#11181C" : "#FFFFFF"}
						/>
					) : (
						<IconSymbol
							name="arrow.up"
							size={18}
							color={
								text.trim()
									? isDark
										? "#11181C"
										: "#FFFFFF"
									: textSecondary
							}
						/>
					)}
				</TouchableOpacity>
			</View>
		</KeyboardAvoidingView>
	);
}

// ─── User Profile Sheet ───────────────────────────────────────────────────────

function UserProfileSheet({
	userId,
	currentUserId,
	isDark,
	tint,
	onClose,
}: {
	userId: Id<"users">;
	currentUserId: Id<"users"> | null;
	isDark: boolean;
	tint: string;
	onClose: () => void;
}) {
	const profile = useQuery(api.userProfile.getProfileById, { userId });
	const posts = useQuery(api.posts.getPostsByUser, { targetUserId: userId });
	const following = useQuery(api.follows.isFollowing, { targetUserId: userId });
	const followerCount = useQuery(api.follows.getFollowerCount, {
		targetUserId: userId,
	});
	const followingCount = useQuery(api.follows.getFollowingCount, { userId });
	const followUser = useMutation(api.follows.followUser);
	const unfollowUser = useMutation(api.follows.unfollowUser);

	const [followLoading, setFollowLoading] = useState(false);

	const bgColor = isDark ? "#0F0F17" : "#F6F6FA";
	const cardBg = isDark ? "#1C1C2E" : "#FFFFFF";
	const textPrimary = isDark ? "#ECEDEE" : "#11181C";
	const textSecondary = isDark ? "#9BA1A6" : "#687076";

	const isOwnProfile = currentUserId === userId;
	const displayName = profile?.displayName ?? "Car Spotter";

	const handleFollowToggle = async () => {
		setFollowLoading(true);
		try {
			if (following) {
				await unfollowUser({ targetUserId: userId });
			} else {
				await followUser({ targetUserId: userId });
			}
		} finally {
			setFollowLoading(false);
		}
	};

	return (
		<View style={[styles.profileSheet, { backgroundColor: bgColor }]}>
			<View style={styles.sheetHandle}>
				<View
					style={[
						styles.handleBar,
						{ backgroundColor: isDark ? "#3A3A4E" : "#D1D1D6" },
					]}
				/>
			</View>

			<ScrollView showsVerticalScrollIndicator={false}>
				<TouchableOpacity
					style={styles.closeBtn}
					onPress={onClose}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<IconSymbol
						name="xmark.circle.fill"
						size={28}
						color={isDark ? "#3A3A4E" : "#C7C7CC"}
					/>
				</TouchableOpacity>

				{/* Avatar + name */}
				<View style={styles.profileAvatarSection}>
					<View
						style={[
							styles.profileAvatar,
							{ backgroundColor: isDark ? "#252538" : "#E8E8F0" },
						]}
					>
						{profile?.imageUrl ? (
							<Image
								source={{ uri: profile.imageUrl }}
								style={styles.profileAvatarImg}
								contentFit="cover"
							/>
						) : (
							<Text style={[styles.profileAvatarInitial, { color: tint }]}>
								{displayName.charAt(0).toUpperCase()}
							</Text>
						)}
					</View>
					<Text style={[styles.profileName, { color: textPrimary }]}>
						{displayName}
					</Text>
					{profile?.isPhotographer ? (
						<View
							style={[
								styles.profilePhotoBadge,
								{ backgroundColor: isDark ? "#2A1A3E" : "#F3E8FF" },
							]}
						>
							<Text style={[styles.profilePhotoBadgeText, { color: "#7B2D8B" }]}>
								📸 Professional Photographer
							</Text>
						</View>
					) : null}
				</View>

				{/* Stats */}
				<View style={[styles.profileStats, { backgroundColor: cardBg }]}>
					<View style={styles.profileStatItem}>
						<Text style={[styles.profileStatValue, { color: textPrimary }]}>
							{posts?.length ?? "—"}
						</Text>
						<Text style={[styles.profileStatLabel, { color: textSecondary }]}>
							Posts
						</Text>
					</View>
					<View
						style={[
							styles.profileStatDivider,
							{ backgroundColor: isDark ? "#252538" : "#F0F0F4" },
						]}
					/>
					<View style={styles.profileStatItem}>
						<Text style={[styles.profileStatValue, { color: textPrimary }]}>
							{followerCount ?? "—"}
						</Text>
						<Text style={[styles.profileStatLabel, { color: textSecondary }]}>
							Followers
						</Text>
					</View>
					<View
						style={[
							styles.profileStatDivider,
							{ backgroundColor: isDark ? "#252538" : "#F0F0F4" },
						]}
					/>
					<View style={styles.profileStatItem}>
						<Text style={[styles.profileStatValue, { color: textPrimary }]}>
							{followingCount ?? "—"}
						</Text>
						<Text style={[styles.profileStatLabel, { color: textSecondary }]}>
							Following
						</Text>
					</View>
				</View>

				{/* Follow button */}
				{!isOwnProfile ? (
					<TouchableOpacity
						style={[
							styles.followBtn,
							following
								? {
										backgroundColor: "transparent",
										borderWidth: 1.5,
										borderColor: isDark ? "#3A3A4E" : "#D1D1D6",
								  }
								: { backgroundColor: tint },
						]}
						onPress={handleFollowToggle}
						disabled={followLoading || following === undefined}
						activeOpacity={0.8}
					>
						{followLoading ? (
							<ActivityIndicator
								size="small"
								color={following ? textSecondary : isDark ? "#11181C" : "#FFFFFF"}
							/>
						) : (
							<Text
								style={[
									styles.followBtnText,
									{
										color: following
											? textSecondary
											: isDark
											? "#11181C"
											: "#FFFFFF",
									},
								]}
							>
								{following ? "Following" : "Follow"}
							</Text>
						)}
					</TouchableOpacity>
				) : null}

				{/* Posts grid */}
				<Text style={[styles.profileGridTitle, { color: textSecondary }]}>
					POSTS
				</Text>
				{posts === undefined ? (
					<ActivityIndicator color={tint} style={{ paddingVertical: 32 }} />
				) : posts.length === 0 ? (
					<Text style={[styles.profileNoPosts, { color: textSecondary }]}>
						No posts yet
					</Text>
				) : (
					<View style={styles.postsGrid}>
						{posts.map((post) => (
							<View key={post._id} style={styles.gridCell}>
								{post.imageUrl ? (
									<Image
										source={{ uri: post.imageUrl }}
										style={styles.gridImage}
										contentFit="cover"
									/>
								) : (
									<View
										style={[
											styles.gridImagePlaceholder,
											{ backgroundColor: isDark ? "#252538" : "#EBEBF0" },
										]}
									>
										<Text style={styles.gridPlaceholderIcon}>
											{POST_TYPE_CONFIG[post.type as PostType].icon}
										</Text>
									</View>
								)}
							</View>
						))}
					</View>
				)}
				{/* Book a Session — photographer profiles viewed by others */}
				{profile?.isPhotographer && !isOwnProfile ? (
					<>
						<Text style={[styles.profileGridTitle, { color: textSecondary }]}>
							BOOK A SESSION
						</Text>
						<View style={{ marginHorizontal: 16, marginBottom: 8 }}>
							<PhotographerCalendar
								photographerId={userId}
								isOwner={false}
								currentUserId={currentUserId}
								isDark={isDark}
								tint={tint}
							/>
						</View>
					</>
				) : null}

				<View style={{ height: 48 }} />
			</ScrollView>
		</View>
	);
}

// ─── Create Post Modal ────────────────────────────────────────────────────────

function CreatePostModal({
	visible,
	isDark,
	tint,
	onClose,
}: {
	visible: boolean;
	isDark: boolean;
	tint: string;
	onClose: () => void;
}) {
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

	const bgColor = isDark ? "#151718" : "#FFFFFF";
	const cardBg = isDark ? "#1C1C2E" : "#F5F5F8";
	const textPrimary = isDark ? "#ECEDEE" : "#11181C";
	const textSecondary = isDark ? "#9BA1A6" : "#687076";
	const inputBg = isDark ? "#252538" : "#F5F5F8";

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
				<View style={[styles.modalSheet, { backgroundColor: bgColor }]}>
					{/* Header */}
					<View style={styles.modalHeader}>
						<TouchableOpacity
							onPress={step === "details" ? () => setStep("type") : handleClose}
						>
							<Text style={[styles.modalHeaderAction, { color: textSecondary }]}>
								{step === "details" ? "Back" : "Cancel"}
							</Text>
						</TouchableOpacity>
						<Text style={[styles.modalTitle, { color: textPrimary }]}>
							New Post
						</Text>
						{step === "details" ? (
							<TouchableOpacity
								onPress={handleSubmit}
								disabled={posting || !canSubmit}
								activeOpacity={0.7}
							>
								{posting ? (
									<ActivityIndicator size="small" color={tint} />
								) : (
									<Text
										style={[
											styles.modalHeaderAction,
											{
												color: canSubmit ? tint : textSecondary,
												fontWeight: "700",
											},
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
						<ScrollView
							contentContainerStyle={styles.typeStep}
							showsVerticalScrollIndicator={false}
						>
							<Text style={[styles.typeStepLabel, { color: textSecondary }]}>
								What are you sharing?
							</Text>
							{(["spotted_car", "car_meet", "photography"] as PostType[]).map(
								(type) => {
									const cfg = POST_TYPE_CONFIG[type];
									const selected = postType === type;
									return (
										<TouchableOpacity
											key={type}
											style={[
												styles.typeOption,
												{
													backgroundColor: selected
														? cfg.color + "18"
														: cardBg,
													borderColor: selected ? cfg.color : "transparent",
												},
											]}
											onPress={() => setPostType(type)}
											activeOpacity={0.8}
										>
											<Text style={styles.typeOptionIcon}>{cfg.icon}</Text>
											<View style={{ flex: 1 }}>
												<Text
													style={[
														styles.typeOptionLabel,
														{
															color: selected ? cfg.color : textPrimary,
														},
													]}
												>
													{cfg.label}
												</Text>
												<Text
													style={[
														styles.typeOptionDesc,
														{ color: textSecondary },
													]}
												>
													{type === "spotted_car"
														? "Share a car you spotted in the wild"
														: type === "car_meet"
														? "Post about a car meet or event"
														: "Announce a photography session or time slot"}
												</Text>
											</View>
											{selected ? (
												<View
													style={[
														styles.typeCheckmark,
														{ backgroundColor: cfg.color },
													]}
												>
													<IconSymbol
														name="checkmark"
														size={13}
														color="#FFFFFF"
													/>
												</View>
											) : null}
										</TouchableOpacity>
									);
								}
							)}
							<TouchableOpacity
								style={[styles.continueBtn, { backgroundColor: tint }]}
								onPress={() => setStep("details")}
								activeOpacity={0.85}
							>
								<Text
									style={[
										styles.continueBtnText,
										{ color: isDark ? "#11181C" : "#FFFFFF" },
									]}
								>
									Continue
								</Text>
							</TouchableOpacity>
						</ScrollView>
					) : (
						<ScrollView
							contentContainerStyle={styles.detailsStep}
							showsVerticalScrollIndicator={false}
							keyboardShouldPersistTaps="handled"
						>
							<View
								style={[
									styles.selectedTypePill,
									{ backgroundColor: typeConfig.color + "18" },
								]}
							>
								<Text style={styles.selectedTypePillIcon}>
									{typeConfig.icon}
								</Text>
								<Text
									style={[
										styles.selectedTypePillLabel,
										{ color: typeConfig.color },
									]}
								>
									{typeConfig.label}
								</Text>
							</View>

							{/* Photo picker */}
							<TouchableOpacity
								style={[
									styles.photoPicker,
									{
										backgroundColor: inputBg,
										borderColor: isDark ? "#252538" : "#E0E0E8",
									},
								]}
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
									<Image
										source={{ uri: imageUri }}
										style={styles.photoPickerPreview}
										contentFit="cover"
									/>
								) : (
									<View style={styles.photoPickerEmpty}>
										<IconSymbol
											name="camera.fill"
											size={26}
											color={textSecondary}
										/>
										<Text
											style={[
												styles.photoPickerLabel,
												{ color: textSecondary },
											]}
										>
											Add Photo (optional)
										</Text>
									</View>
								)}
							</TouchableOpacity>

							{postType === "spotted_car" ? (
								<View style={styles.fieldGroup}>
									<TextInput
										style={[
											styles.input,
											{ backgroundColor: inputBg, color: textPrimary },
										]}
										placeholder="Brand (e.g. Ferrari)"
										placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
										value={brand}
										onChangeText={setBrand}
										autoCapitalize="words"
									/>
									<TextInput
										style={[
											styles.input,
											{ backgroundColor: inputBg, color: textPrimary },
										]}
										placeholder="Model (e.g. 488 Pista)"
										placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
										value={model}
										onChangeText={setModel}
										autoCapitalize="words"
									/>
								</View>
							) : (
								<View style={styles.fieldGroup}>
									<TextInput
										style={[
											styles.input,
											{ backgroundColor: inputBg, color: textPrimary },
										]}
										placeholder={
											postType === "car_meet"
												? "Event title (e.g. Cars & Coffee LA)"
												: "Session title (e.g. Golden Hour Shoot)"
										}
										placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
										value={title}
										onChangeText={setTitle}
										autoCapitalize="sentences"
									/>
									<TextInput
										style={[
											styles.input,
											{ backgroundColor: inputBg, color: textPrimary },
										]}
										placeholder="Location"
										placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
										value={location}
										onChangeText={setLocation}
										autoCapitalize="words"
									/>
									<TextInput
										style={[
											styles.input,
											{ backgroundColor: inputBg, color: textPrimary },
										]}
										placeholder={
											postType === "car_meet"
												? "Date (e.g. Mar 15, 2025)"
												: "Date & time (e.g. Mar 15 · 6–8 PM)"
										}
										placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
										value={eventDate}
										onChangeText={setEventDate}
									/>
								</View>
							)}

							<TextInput
								style={[
									styles.input,
									styles.captionInput,
									{ backgroundColor: inputBg, color: textPrimary },
								]}
								placeholder="Write a caption..."
								placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
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

// ─── Feed Screen ──────────────────────────────────────────────────────────────

export default function FeedScreen() {
	const colorScheme = useColorScheme() ?? "light";
	const isDark = colorScheme === "dark";
	const tint = Colors[colorScheme].tint;
	const bgColor = isDark ? "#0F0F17" : "#F6F6FA";
	const textPrimary = isDark ? "#ECEDEE" : "#11181C";
	const textSecondary = isDark ? "#9BA1A6" : "#687076";

	const posts = useQuery(api.posts.getFeedPosts);
	const currentUserId = useQuery(api.userProfile.getCurrentUserId);
	const deletePost = useMutation(api.posts.deletePost);

	const [showCreate, setShowCreate] = useState(false);
	const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
	const [selectedPostForComments, setSelectedPostForComments] = useState<Id<"posts"> | null>(null);

	const handleDeletePost = useCallback(
		(postId: Id<"posts">) => {
			deletePost({ postId }).catch(() =>
				Alert.alert("Error", "Failed to delete post.")
			);
		},
		[deletePost]
	);

	const renderPost = useCallback(
		({ item }: { item: FeedPost }) => (
			<PostCard
				post={item}
				isDark={isDark}
				tint={tint}
				onPressUser={setSelectedUserId}
				onDelete={handleDeletePost}
				onPressComment={setSelectedPostForComments}
			/>
		),
		[isDark, tint, handleDeletePost]
	);

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
			{/* Header */}
			<View
				style={[
					styles.header,
					{ borderBottomColor: isDark ? "#1C1C2E" : "#EBEBF0" },
				]}
			>
				<Text
					style={[
						styles.headerTitle,
						{
							color: tint,
							fontFamily: Fonts?.rounded ?? undefined,
						},
					]}
				>
					CarSight
				</Text>
				<TouchableOpacity
					style={[styles.postBtn, { backgroundColor: tint }]}
					onPress={() => setShowCreate(true)}
					activeOpacity={0.85}
				>
					<IconSymbol
						name="plus"
						size={16}
						color={isDark ? "#11181C" : "#FFFFFF"}
					/>
					<Text
						style={[
							styles.postBtnText,
							{ color: isDark ? "#11181C" : "#FFFFFF" },
						]}
					>
						Post
					</Text>
				</TouchableOpacity>
			</View>

			{/* Feed */}
			{posts === undefined ? (
				<View style={styles.loadingWrap}>
					<ActivityIndicator size="large" color={tint} />
				</View>
			) : posts.length === 0 ? (
				<ScrollView contentContainerStyle={styles.emptyWrap}>
					<Text style={styles.emptyIcon}>🚗</Text>
					<Text style={[styles.emptyTitle, { color: textPrimary }]}>
						No posts yet
					</Text>
					<Text style={[styles.emptySubtitle, { color: textSecondary }]}>
						Be the first to share a car spot, event, or photography session
					</Text>
					<TouchableOpacity
						style={[styles.emptyBtn, { backgroundColor: tint }]}
						onPress={() => setShowCreate(true)}
						activeOpacity={0.85}
					>
						<Text
							style={[
								styles.emptyBtnText,
								{ color: isDark ? "#11181C" : "#FFFFFF" },
							]}
						>
							Create first post
						</Text>
					</TouchableOpacity>
				</ScrollView>
			) : (
				<FlatList
					data={posts as FeedPost[]}
					keyExtractor={(item) => item._id}
					renderItem={renderPost}
					contentContainerStyle={styles.feedList}
					showsVerticalScrollIndicator={false}
					ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
				/>
			)}

			<CreatePostModal
				visible={showCreate}
				isDark={isDark}
				tint={tint}
				onClose={() => setShowCreate(false)}
			/>

			{/* User Profile Modal */}
			<Modal
				visible={selectedUserId !== null}
				animationType="slide"
				transparent
				presentationStyle="overFullScreen"
				onRequestClose={() => setSelectedUserId(null)}
			>
				<View style={styles.profileModalOverlay}>
					<Pressable
						style={styles.profileModalBackdrop}
						onPress={() => setSelectedUserId(null)}
					/>
					{selectedUserId !== null ? (
						<UserProfileSheet
							userId={selectedUserId}
							currentUserId={currentUserId ?? null}
							isDark={isDark}
							tint={tint}
							onClose={() => setSelectedUserId(null)}
						/>
					) : null}
				</View>
			</Modal>
			{/* Comments Modal */}
			<Modal
				visible={selectedPostForComments !== null}
				animationType="slide"
				transparent
				presentationStyle="overFullScreen"
				onRequestClose={() => setSelectedPostForComments(null)}
			>
				<View style={styles.profileModalOverlay}>
					<Pressable
						style={styles.profileModalBackdrop}
						onPress={() => setSelectedPostForComments(null)}
					/>
					{selectedPostForComments !== null ? (
						<CommentsSheet
							postId={selectedPostForComments}
							isDark={isDark}
							tint={tint}
							onClose={() => setSelectedPostForComments(null)}
						/>
					) : null}
				</View>
			</Modal>
		</SafeAreaView>
	);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	container: { flex: 1 },

	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	headerTitle: { fontSize: 26, fontWeight: "800" },
	postBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 5,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 20,
	},
	postBtnText: { fontSize: 14, fontWeight: "600" },

	feedList: { padding: 12, paddingBottom: 32 },
	loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
	emptyWrap: {
		flexGrow: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 32,
		gap: 12,
	},
	emptyIcon: { fontSize: 56, marginBottom: 4 },
	emptyTitle: { fontSize: 20, fontWeight: "700", textAlign: "center" },
	emptySubtitle: {
		fontSize: 14,
		textAlign: "center",
		lineHeight: 20,
		maxWidth: 260,
	},
	emptyBtn: {
		marginTop: 8,
		paddingHorizontal: 24,
		paddingVertical: 14,
		borderRadius: 24,
	},
	emptyBtnText: { fontSize: 15, fontWeight: "700" },

	// Post Card
	card: {
		borderRadius: 20,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.07,
		shadowRadius: 8,
		elevation: 2,
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		gap: 10,
	},
	avatarCircle: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
	},
	avatarImg: { width: 40, height: 40 },
	avatarInitial: { fontSize: 18, fontWeight: "700" },
	headerMeta: { flex: 1 },
	headerNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
	authorName: { fontSize: 14, fontWeight: "700" },
	proBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
	proBadgeText: { fontSize: 10, fontWeight: "600", color: "#7B2D8B" },
	postTime: { fontSize: 12, marginTop: 2 },
	typeBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 10,
	},
	typeBadgeIcon: { fontSize: 12 },
	typeBadgeLabel: { fontSize: 11, fontWeight: "700" },

	postImage: { width: "100%", height: SCREEN_WIDTH * 0.75 },

	eventDetails: {
		paddingHorizontal: 14,
		paddingTop: 12,
		paddingBottom: 4,
		borderTopWidth: 1,
	},
	eventTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
	eventMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
	eventMetaText: { fontSize: 13 },

	carDetails: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
	carLabel: { fontSize: 16, fontWeight: "700" },

	actions: {
		flexDirection: "row",
		paddingHorizontal: 12,
		paddingTop: 10,
		paddingBottom: 4,
		gap: 16,
	},
	actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
	likeIcon: { fontSize: 20 },
	commentIcon: { fontSize: 20 },
	actionCount: { fontSize: 14 },

	captionWrap: {
		flexDirection: "row",
		flexWrap: "wrap",
		paddingHorizontal: 14,
		paddingBottom: 14,
		paddingTop: 4,
	},
	captionAuthor: { fontSize: 13, fontWeight: "700" },
	captionText: { fontSize: 13, lineHeight: 18 },

	// Create Post Modal
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.55)",
		justifyContent: "flex-end",
	},
	modalSheet: {
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		maxHeight: "92%",
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 12,
	},
	modalTitle: { fontSize: 18, fontWeight: "700" },
	modalHeaderAction: { fontSize: 15, fontWeight: "500", minWidth: 52 },

	typeStep: { paddingHorizontal: 20, paddingBottom: 36, gap: 12 },
	typeStepLabel: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
	typeOption: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		borderRadius: 18,
		borderWidth: 2,
		gap: 14,
	},
	typeOptionIcon: { fontSize: 28 },
	typeOptionLabel: { fontSize: 16, fontWeight: "700", marginBottom: 3 },
	typeOptionDesc: { fontSize: 13, lineHeight: 17 },
	typeCheckmark: {
		width: 26,
		height: 26,
		borderRadius: 13,
		justifyContent: "center",
		alignItems: "center",
	},
	continueBtn: {
		paddingVertical: 16,
		borderRadius: 18,
		alignItems: "center",
		marginTop: 8,
	},
	continueBtnText: { fontSize: 16, fontWeight: "700" },

	detailsStep: { paddingHorizontal: 20, paddingBottom: 36, gap: 12 },
	selectedTypePill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		alignSelf: "flex-start",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
		marginBottom: 4,
	},
	selectedTypePillIcon: { fontSize: 16 },
	selectedTypePillLabel: { fontSize: 13, fontWeight: "700" },

	photoPicker: {
		height: 170,
		borderRadius: 16,
		borderWidth: 1.5,
		borderStyle: "dashed",
		overflow: "hidden",
		justifyContent: "center",
		alignItems: "center",
	},
	photoPickerEmpty: { alignItems: "center", gap: 8 },
	photoPickerLabel: { fontSize: 14, fontWeight: "500" },
	photoPickerPreview: { width: "100%", height: "100%" },

	fieldGroup: { gap: 10 },
	input: {
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 13,
		fontSize: 15,
	},
	captionInput: { minHeight: 90, paddingTop: 13 },

	// User Profile Modal
	profileModalOverlay: { flex: 1, justifyContent: "flex-end" },
	profileModalBackdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	profileSheet: {
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		maxHeight: "88%",
	},
	sheetHandle: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
	handleBar: { width: 36, height: 4, borderRadius: 2 },
	closeBtn: { alignSelf: "flex-end", paddingHorizontal: 16, paddingVertical: 6 },

	profileAvatarSection: {
		alignItems: "center",
		paddingTop: 8,
		paddingBottom: 20,
		gap: 10,
	},
	profileAvatar: {
		width: 80,
		height: 80,
		borderRadius: 40,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
	},
	profileAvatarImg: { width: 80, height: 80 },
	profileAvatarInitial: { fontSize: 32, fontWeight: "700" },
	profileName: { fontSize: 20, fontWeight: "700" },
	profilePhotoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
	profilePhotoBadgeText: { fontSize: 13, fontWeight: "600" },

	profileStats: {
		flexDirection: "row",
		alignItems: "center",
		marginHorizontal: 16,
		borderRadius: 18,
		padding: 16,
	},
	profileStatItem: { flex: 1, alignItems: "center" },
	profileStatValue: { fontSize: 22, fontWeight: "700" },
	profileStatLabel: { fontSize: 12, marginTop: 2 },
	profileStatDivider: { width: 1, height: 32 },

	followBtn: {
		marginHorizontal: 16,
		marginTop: 14,
		paddingVertical: 14,
		borderRadius: 14,
		alignItems: "center",
	},
	followBtnText: { fontSize: 15, fontWeight: "700" },

	profileGridTitle: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1.2,
		paddingHorizontal: 16,
		marginTop: 20,
		marginBottom: 10,
	},
	profileNoPosts: { textAlign: "center", paddingVertical: 24, fontSize: 14 },
	postsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		paddingHorizontal: 12,
		gap: 3,
	},
	gridCell: {
		width: (SCREEN_WIDTH - 24 - 6) / 3,
		height: (SCREEN_WIDTH - 24 - 6) / 3,
		borderRadius: 8,
		overflow: "hidden",
	},
	gridImage: { width: "100%", height: "100%" },
	gridImagePlaceholder: {
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	gridPlaceholderIcon: { fontSize: 28 },

	// Comments Sheet
	commentsSheet: {
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		maxHeight: "88%",
		flex: 1,
	},
	commentsHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 14,
		borderBottomWidth: 1,
	},
	commentsTitle: { fontSize: 17, fontWeight: "700" },
	commentsEmpty: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 48,
		gap: 10,
	},
	commentsEmptyIcon: { fontSize: 40 },
	commentsEmptyText: { fontSize: 14 },
	commentsList: { padding: 16, gap: 14 },
	commentRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
	commentAvatar: {
		width: 34,
		height: 34,
		borderRadius: 17,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
	},
	commentAvatarImg: { width: 34, height: 34 },
	commentAvatarInitial: { fontSize: 14, fontWeight: "700" },
	commentBubble: {
		flex: 1,
		borderRadius: 16,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	commentBubbleHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 4,
	},
	commentAuthor: { fontSize: 13, fontWeight: "700" },
	commentTime: { fontSize: 11 },
	commentText: { fontSize: 14, lineHeight: 19 },
	commentInputRow: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 10,
		padding: 12,
		borderTopWidth: 1,
	},
	commentInput: {
		flex: 1,
		borderRadius: 20,
		paddingHorizontal: 14,
		paddingVertical: 10,
		fontSize: 15,
		maxHeight: 100,
	},
	commentSendBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
	},
});
