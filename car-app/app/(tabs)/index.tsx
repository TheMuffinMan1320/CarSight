import React, { useState, useCallback } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	Modal,
	ScrollView,
	ActivityIndicator,
	Alert,
	Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Fonts } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { styles } from "@/styles/feed";
import { PostCard } from "@/components/feed/post-card";
import { CommentsSheet } from "@/components/feed/comments-sheet";
import { UserProfileSheet } from "@/components/feed/user-profile-sheet";
import { CreatePostModal } from "@/components/feed/create-post-modal";
import { FeedPost } from "@/components/feed/types";

export default function FeedScreen() {
	const { colors, tint } = useAppTheme();

	const posts = useQuery(api.posts.getFeedPosts);
	const currentUserId = useQuery(api.userProfile.getCurrentUserId);
	const deletePost = useMutation(api.posts.deletePost);

	const [showCreate, setShowCreate] = useState(false);
	const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
	const [selectedPostForComments, setSelectedPostForComments] = useState<Id<"posts"> | null>(null);

	const handleDeletePost = useCallback(
		(postId: Id<"posts">) => {
			deletePost({ postId }).catch(() => Alert.alert("Error", "Failed to delete post."));
		},
		[deletePost]
	);

	const renderPost = useCallback(
		({ item }: { item: FeedPost }) => (
			<PostCard
				post={item}
				onPressUser={setSelectedUserId}
				onDelete={handleDeletePost}
				onPressComment={setSelectedPostForComments}
			/>
		),
		[handleDeletePost]
	);

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.pageBg }]}>
			{/* Header */}
			<View style={[styles.header, { borderBottomColor: colors.searchBg }]}>
				<Text style={[styles.headerTitle, { color: tint, fontFamily: Fonts?.rounded ?? undefined }]}>
					CarSight
				</Text>
				<TouchableOpacity
					style={[styles.postBtn, { backgroundColor: tint }]}
					onPress={() => setShowCreate(true)}
					activeOpacity={0.85}
				>
					<IconSymbol name="plus" size={16} color={colors.iconOnTint} />
					<Text style={[styles.postBtnText, { color: colors.iconOnTint }]}>Post</Text>
				</TouchableOpacity>
			</View>

			{/* Feed */}
			{posts === undefined ? (
				<View style={styles.loadingWrap}>
					<ActivityIndicator size="large" color={tint} />
				</View>
			) : posts.length === 0 ? (
				<ScrollView contentContainerStyle={styles.emptyWrap}>
					<Ionicons name="car-sport-outline" size={56} color={tint} style={{ marginBottom: 4 }} />
					<Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No posts yet</Text>
					<Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
						Be the first to share a car spot, event, or photography session
					</Text>
					<TouchableOpacity
						style={[styles.emptyBtn, { backgroundColor: tint }]}
						onPress={() => setShowCreate(true)}
						activeOpacity={0.85}
					>
						<Text style={[styles.emptyBtnText, { color: colors.iconOnTint }]}>
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

			<CreatePostModal visible={showCreate} onClose={() => setShowCreate(false)} />

			{/* User Profile Modal */}
			<Modal
				visible={selectedUserId !== null}
				animationType="slide"
				transparent
				presentationStyle="overFullScreen"
				onRequestClose={() => setSelectedUserId(null)}
			>
				<View style={styles.profileModalOverlay}>
					<Pressable style={styles.profileModalBackdrop} onPress={() => setSelectedUserId(null)} />
					{selectedUserId !== null ? (
						<UserProfileSheet
							userId={selectedUserId}
							currentUserId={currentUserId ?? null}
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
					<Pressable style={styles.profileModalBackdrop} onPress={() => setSelectedPostForComments(null)} />
					{selectedPostForComments !== null ? (
						<CommentsSheet
							postId={selectedPostForComments}
							onClose={() => setSelectedPostForComments(null)}
						/>
					) : null}
				</View>
			</Modal>
		</SafeAreaView>
	);
}
