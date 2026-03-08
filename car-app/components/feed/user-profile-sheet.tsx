import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/hooks/use-app-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import PhotographerCalendar from "@/components/photographer-calendar";
import { styles } from "@/styles/feed";
import { PostType } from "./types";
import { PostTypeIcon } from "./post-type-icon";

type Props = {
	userId: Id<"users">;
	currentUserId: Id<"users"> | null;
	onClose: () => void;
	mode?: "posts" | "collection";
};

export function UserProfileSheet({ userId, currentUserId, onClose, mode = "posts" }: Props) {
	const { colors, tint, isDark } = useAppTheme();
	const profile = useQuery(api.userProfile.getProfileById, { userId });
	const posts = useQuery(api.posts.getPostsByUser, { targetUserId: userId });
	const collection = useQuery(api.spottedCars.getSpottedCarsByUser, { userId });
	const following = useQuery(api.follows.isFollowing, { targetUserId: userId });
	const followerCount = useQuery(api.follows.getFollowerCount, { targetUserId: userId });
	const followingCount = useQuery(api.follows.getFollowingCount, { userId });
	const followUser = useMutation(api.follows.followUser);
	const unfollowUser = useMutation(api.follows.unfollowUser);

	const [followLoading, setFollowLoading] = useState(false);

	const isOwnProfile = currentUserId === userId;
	const displayName = profile?.displayName ?? "Car Spotter";

	const handleFollowToggle = async () => {
		setFollowLoading(true);
		try {
			if (following) await unfollowUser({ targetUserId: userId });
			else await followUser({ targetUserId: userId });
		} finally {
			setFollowLoading(false);
		}
	};

	return (
		<View style={[styles.profileSheet, { backgroundColor: colors.pageBg }]}>
			<View style={styles.sheetHandle}>
				<View style={[styles.handleBar, { backgroundColor: colors.switchTrackOff }]} />
			</View>

			<ScrollView showsVerticalScrollIndicator={false}>
				<TouchableOpacity
					style={styles.closeBtn}
					onPress={onClose}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<IconSymbol name="xmark.circle.fill" size={28} color={colors.iconInactive} />
				</TouchableOpacity>

				{/* Avatar + name */}
				<View style={styles.profileAvatarSection}>
					<View style={[styles.profileAvatar, { backgroundColor: colors.avatarBg }]}>
						{profile?.imageUrl ? (
							<Image source={{ uri: profile.imageUrl }} style={styles.profileAvatarImg} contentFit="cover" />
						) : (
							<Text style={[styles.profileAvatarInitial, { color: tint }]}>
								{displayName.charAt(0).toUpperCase()}
							</Text>
						)}
					</View>
					<Text style={[styles.profileName, { color: colors.textPrimary }]}>{displayName}</Text>
					{profile?.isPhotographer ? (
						<View style={[styles.profilePhotoBadge, { backgroundColor: colors.photographyBg }]}>
							<View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
								<Ionicons name="camera-outline" size={13} color="#C9A84C" />
								<Text style={[styles.profilePhotoBadgeText, { color: "#C9A84C" }]}>Photographer</Text>
							</View>
						</View>
					) : null}
				</View>

				{/* Stats */}
				<View style={[styles.profileStats, { backgroundColor: colors.surface }]}>
					<View style={styles.profileStatItem}>
						<Text style={[styles.profileStatValue, { color: colors.textPrimary }]}>
							{posts?.length ?? "—"}
						</Text>
						<Text style={[styles.profileStatLabel, { color: colors.textSecondary }]}>Posts</Text>
					</View>
					<View style={[styles.profileStatDivider, { backgroundColor: colors.separator }]} />
					<View style={styles.profileStatItem}>
						<Text style={[styles.profileStatValue, { color: colors.textPrimary }]}>
							{followerCount ?? "—"}
						</Text>
						<Text style={[styles.profileStatLabel, { color: colors.textSecondary }]}>Followers</Text>
					</View>
					<View style={[styles.profileStatDivider, { backgroundColor: colors.separator }]} />
					<View style={styles.profileStatItem}>
						<Text style={[styles.profileStatValue, { color: colors.textPrimary }]}>
							{followingCount ?? "—"}
						</Text>
						<Text style={[styles.profileStatLabel, { color: colors.textSecondary }]}>Following</Text>
					</View>
				</View>

				{/* Follow button */}
				{!isOwnProfile ? (
					<TouchableOpacity
						style={[
							styles.followBtn,
							following
								? { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.switchTrackOff }
								: { backgroundColor: tint },
						]}
						onPress={handleFollowToggle}
						disabled={followLoading || following === undefined}
						activeOpacity={0.8}
					>
						{followLoading ? (
							<ActivityIndicator size="small" color={following ? colors.textSecondary : colors.iconOnTint} />
						) : (
							<Text style={[styles.followBtnText, { color: following ? colors.textSecondary : colors.iconOnTint }]}>
								{following ? "Following" : "Follow"}
							</Text>
						)}
					</TouchableOpacity>
				) : null}

				{/* Grid section — posts or collection depending on mode */}
				{mode === "collection" ? (
					<>
						<Text style={[styles.profileGridTitle, { color: colors.textSecondary }]}>SPOTTED</Text>
						{collection === undefined ? (
							<ActivityIndicator color={tint} style={{ paddingVertical: 32 }} />
						) : collection.length === 0 ? (
							<Text style={[styles.profileNoPosts, { color: colors.textSecondary }]}>No cars spotted yet</Text>
						) : (
							<View style={styles.postsGrid}>
								{collection.map((car) => (
									<View key={car._id} style={styles.gridCell}>
										{car.imageUrl ? (
											<>
											<Image source={{ uri: car.imageUrl }} style={styles.gridImage} contentFit="cover" />
											<View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.45)", paddingVertical: 3, paddingHorizontal: 4 }}>
												<Text style={{ fontSize: 10, color: "#fff", fontWeight: "600", textAlign: "center" }} numberOfLines={1}>
													{car.brand} {car.model}
												</Text>
											</View>
										</>
										) : (
											<View style={[styles.gridImagePlaceholder, { backgroundColor: colors.searchBg }]}>
												<Ionicons name="car-sport-outline" size={28} color={colors.textSecondary} />
												<Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 4, textAlign: "center", paddingHorizontal: 4 }} numberOfLines={1}>
													{car.brand} {car.model}
												</Text>
											</View>
										)}
									</View>
								))}
							</View>
						)}
					</>
				) : (
					<>
						<Text style={[styles.profileGridTitle, { color: colors.textSecondary }]}>POSTS</Text>
						{posts === undefined ? (
							<ActivityIndicator color={tint} style={{ paddingVertical: 32 }} />
						) : posts.length === 0 ? (
							<Text style={[styles.profileNoPosts, { color: colors.textSecondary }]}>No posts yet</Text>
						) : (
							<View style={styles.postsGrid}>
								{posts.map((post) => (
									<View key={post._id} style={styles.gridCell}>
										{post.imageUrl ? (
											<Image source={{ uri: post.imageUrl }} style={styles.gridImage} contentFit="cover" />
										) : (
											<View style={[styles.gridImagePlaceholder, { backgroundColor: colors.searchBg }]}>
												<PostTypeIcon type={post.type as PostType} size={28} color={colors.textSecondary} />
											</View>
										)}
									</View>
								))}
							</View>
						)}
					</>
				)}

				{/* Book a Session */}
				{profile?.isPhotographer && !isOwnProfile ? (
					<>
						<Text style={[styles.profileGridTitle, { color: colors.textSecondary }]}>BOOK A SESSION</Text>
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
