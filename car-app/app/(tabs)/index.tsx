import React, { useState, useCallback, useEffect } from "react";
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
	Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
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
import { SpotMapModal } from "@/components/feed/spot-map-modal";
import { UserSearchModal } from "@/components/feed/user-search-modal";
import { FeedPost, POST_TYPE_CONFIG, PostType } from "@/components/feed/types";
import { PostTypeIcon } from "@/components/feed/post-type-icon";

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
});

export default function FeedScreen() {
	const { colors, tint } = useAppTheme();

	const posts = useQuery(api.posts.getFeedPosts);
	const currentUserId = useQuery(api.userProfile.getCurrentUserId);
	const deletePost = useMutation(api.posts.deletePost);
	const upsertProfile = useMutation(api.userProfile.upsertProfile);

	const [showCreate, setShowCreate] = useState(false);
	const [showMap, setShowMap] = useState(false);
	const [showSearch, setShowSearch] = useState(false);
	const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
	const [selectedPostForComments, setSelectedPostForComments] = useState<Id<"posts"> | null>(null);
	const [activeFilter, setActiveFilter] = useState<PostType | "my_posts" | null>(null);

	// Register for push notifications
	useEffect(() => {
		(async () => {
			const { status: existing } = await Notifications.getPermissionsAsync();
			let finalStatus = existing;
			if (existing !== "granted") {
				const { status } = await Notifications.requestPermissionsAsync();
				finalStatus = status;
			}
			if (finalStatus !== "granted") return;
			if (Platform.OS === "android") {
				await Notifications.setNotificationChannelAsync("default", {
					name: "default",
					importance: Notifications.AndroidImportance.MAX,
				});
			}
			try {
				const tokenData = await Notifications.getExpoPushTokenAsync();
				await upsertProfile({ pushToken: tokenData.data });
			} catch {
				// Push token unavailable (e.g. no EAS projectId configured)
			}
		})();
	}, [upsertProfile]);

	const handleDeletePost = useCallback(
		(postId: Id<"posts">) => {
			deletePost({ postId }).catch(() => Alert.alert("Error", "Failed to delete post."));
		},
		[deletePost]
	);

	const filteredPosts =
		activeFilter === "my_posts"
			? (posts as FeedPost[] | undefined)?.filter((p) => p.isOwnPost)
			: activeFilter
			? (posts as FeedPost[] | undefined)?.filter((p) => p.type === activeFilter)
			: (posts as FeedPost[] | undefined);

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
				<View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
					<TouchableOpacity
						style={[styles.mapBtn, { backgroundColor: colors.inputBg }]}
						onPress={() => setShowSearch(true)}
						activeOpacity={0.85}
					>
						<Ionicons name="search-outline" size={18} color={tint} />
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.mapBtn, { backgroundColor: colors.inputBg }]}
						onPress={() => setShowMap(true)}
						activeOpacity={0.85}
					>
						<IconSymbol name="map" size={18} color={tint} />
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.postBtn, { backgroundColor: tint }]}
						onPress={() => setShowCreate(true)}
						activeOpacity={0.85}
					>
						<IconSymbol name="plus" size={16} color={colors.iconOnTint} />
						<Text style={[styles.postBtnText, { color: colors.iconOnTint }]}>Post</Text>
					</TouchableOpacity>
				</View>
			</View>

			{/* Filter Bar */}
			<View style={styles.filterBarWrapper}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.filterBar}
			>
				<TouchableOpacity
					style={[styles.filterChip, {
						backgroundColor: activeFilter === null ? tint : colors.inputBg,
						borderColor: activeFilter === null ? tint : "transparent",
					}]}
					onPress={() => setActiveFilter(null)}
					activeOpacity={0.8}
				>
					<Text style={[styles.filterChipText, { color: activeFilter === null ? colors.iconOnTint : colors.textSecondary }]}>
						All
					</Text>
				</TouchableOpacity>
				{(Object.entries(POST_TYPE_CONFIG) as [PostType, (typeof POST_TYPE_CONFIG)[PostType]][]).map(
					([type, config]) => {
						const active = activeFilter === type;
						return (
							<TouchableOpacity
								key={type}
								style={[
									styles.filterChip,
									{
										backgroundColor: active ? config.color + "22" : colors.inputBg,
										borderColor: active ? config.color : "transparent",
									},
								]}
								onPress={() => setActiveFilter(active ? null : type)}
								activeOpacity={0.8}
							>
								<PostTypeIcon type={type} size={13} color={active ? config.color : colors.textSecondary} />
								<Text style={[styles.filterChipText, { color: active ? config.color : colors.textSecondary }]}>
									{config.label}
								</Text>
							</TouchableOpacity>
						);
					}
				)}
				<TouchableOpacity
					style={[styles.filterChip, {
						backgroundColor: activeFilter === "my_posts" ? tint : colors.inputBg,
						borderColor: activeFilter === "my_posts" ? tint : "transparent",
					}]}
					onPress={() => setActiveFilter(activeFilter === "my_posts" ? null : "my_posts")}
					activeOpacity={0.8}
				>
					<Ionicons name="person-outline" size={13} color={activeFilter === "my_posts" ? colors.iconOnTint : colors.textSecondary} />
					<Text style={[styles.filterChipText, { color: activeFilter === "my_posts" ? colors.iconOnTint : colors.textSecondary }]}>
						My Posts
					</Text>
				</TouchableOpacity>
			</ScrollView>
			</View>

			{/* Feed */}
			{posts === undefined ? (
				<View style={styles.loadingWrap}>
					<ActivityIndicator size="large" color={tint} />
				</View>
			) : (filteredPosts ?? []).length === 0 ? (
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
					data={filteredPosts as FeedPost[]}
					keyExtractor={(item) => item._id}
					renderItem={renderPost}
					contentContainerStyle={styles.feedList}
					showsVerticalScrollIndicator={false}
					ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
				/>
			)}

			<CreatePostModal visible={showCreate} onClose={() => setShowCreate(false)} />
			<SpotMapModal visible={showMap} onClose={() => setShowMap(false)} />
			<UserSearchModal
				visible={showSearch}
				onClose={() => setShowSearch(false)}
				onPressUser={(uid) => { setShowSearch(false); setSelectedUserId(uid); }}
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
