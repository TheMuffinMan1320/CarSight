import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		return await ctx.storage.generateUploadUrl();
	},
});

export const createPost = mutation({
	args: {
		type: v.union(
			v.literal("spotted_car"),
			v.literal("car_meet"),
			v.literal("photography")
		),
		caption: v.optional(v.string()),
		imageStorageId: v.optional(v.id("_storage")),
		brand: v.optional(v.string()),
		model: v.optional(v.string()),
		title: v.optional(v.string()),
		location: v.optional(v.string()),
		eventDate: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		const postId = await ctx.db.insert("posts", { userId, ...args });
		if (args.type === "spotted_car" && args.brand && args.model) {
			await ctx.scheduler.runAfter(0, internal.notifications.checkWatchlistAndNotify, {
				brand: args.brand,
				model: args.model,
				location: args.location,
				posterUserId: userId as Id<"users">,
			});
		}
		return postId;
	},
});

export const getFeedPosts = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);

		// Collect IDs of users the current user follows
		const followedUserIds = userId
			? (
					await ctx.db
						.query("follows")
						.withIndex("by_follower", (q) => q.eq("followerId", userId))
						.collect()
				).map((f) => f.followingId)
			: [];

		// Include own posts + followed users' posts, fetched per user via index
		const authorIds = [...(userId ? [userId] : []), ...followedUserIds];

		const postsByAuthor = await Promise.all(
			authorIds.map((uid) =>
				ctx.db
					.query("posts")
					.withIndex("by_user", (q) => q.eq("userId", uid))
					.order("desc")
					.take(20)
			)
		);

		const posts = postsByAuthor
			.flat()
			.sort((a, b) => b._creationTime - a._creationTime)
			.slice(0, 50);

		return await Promise.all(
			posts.map(async (post) => {
				const profile = await ctx.db
					.query("userProfile")
					.withIndex("by_user", (q) => q.eq("userId", post.userId))
					.first();

				const imageUrl = post.imageStorageId
					? await ctx.storage.getUrl(post.imageStorageId)
					: null;

				const avatarUrl = profile?.imageStorageId
					? await ctx.storage.getUrl(profile.imageStorageId)
					: null;

				const [likeDocs, commentDocs] = await Promise.all([
					ctx.db
						.query("postLikes")
						.withIndex("by_post", (q) => q.eq("postId", post._id))
						.collect(),
					ctx.db
						.query("comments")
						.withIndex("by_post", (q) => q.eq("postId", post._id))
						.collect(),
				]);

				const isLiked = userId
					? !!(await ctx.db
							.query("postLikes")
							.withIndex("by_user_post", (q) =>
								q.eq("userId", userId).eq("postId", post._id)
							)
							.first())
					: false;

				return {
					...post,
					imageUrl,
					authorName: profile?.displayName ?? "Car Spotter",
					authorAvatarUrl: avatarUrl,
					isPhotographer: profile?.isPhotographer ?? false,
					likeCount: likeDocs.length,
					commentCount: commentDocs.length,
					isLiked,
					isOwnPost: userId ? post.userId === userId : false,
				};
			})
		);
	},
});

export const getPostsByUser = query({
	args: { targetUserId: v.id("users") },
	handler: async (ctx, { targetUserId }) => {
		const userId = await getAuthUserId(ctx);
		const posts = await ctx.db
			.query("posts")
			.withIndex("by_user", (q) => q.eq("userId", targetUserId))
			.order("desc")
			.collect();

		return await Promise.all(
			posts.map(async (post) => {
				const imageUrl = post.imageStorageId
					? await ctx.storage.getUrl(post.imageStorageId)
					: null;

				const likeDocs = await ctx.db
					.query("postLikes")
					.withIndex("by_post", (q) => q.eq("postId", post._id))
					.collect();

				const isLiked = userId
					? !!(await ctx.db
							.query("postLikes")
							.withIndex("by_user_post", (q) =>
								q.eq("userId", userId).eq("postId", post._id)
							)
							.first())
					: false;

				return {
					...post,
					imageUrl,
					likeCount: likeDocs.length,
					isLiked,
				};
			})
		);
	},
});

export const getWatchlistSpots = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];

		const watchlist = await ctx.db
			.query("watchlist")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		if (watchlist.length === 0) return [];

		const allPosts = await ctx.db
			.query("posts")
			.order("desc")
			.collect();

		const spots = allPosts.filter(
			(p) =>
				p.type === "spotted_car" &&
				p.brand &&
				p.model &&
				p.location &&
				watchlist.some(
					(w) =>
						w.brand.toLowerCase() === p.brand!.toLowerCase() &&
						w.model.toLowerCase() === p.model!.toLowerCase()
				)
		);

		return await Promise.all(
			spots.map(async (post) => {
				const imageUrl = post.imageStorageId
					? await ctx.storage.getUrl(post.imageStorageId)
					: null;
				const profile = await ctx.db
					.query("userProfile")
					.withIndex("by_user", (q) => q.eq("userId", post.userId))
					.first();
				return {
					_id: post._id,
					brand: post.brand!,
					model: post.model!,
					location: post.location!,
					caption: post.caption,
					imageUrl,
					authorName: profile?.displayName ?? "Car Spotter",
					_creationTime: post._creationTime,
				};
			})
		);
	},
});

export const toggleLike = mutation({
	args: { postId: v.id("posts") },
	handler: async (ctx, { postId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");

		const existing = await ctx.db
			.query("postLikes")
			.withIndex("by_user_post", (q) =>
				q.eq("userId", userId).eq("postId", postId)
			)
			.first();

		if (existing) {
			await ctx.db.delete(existing._id);
		} else {
			await ctx.db.insert("postLikes", { userId, postId });
		}
	},
});

export const updatePost = mutation({
	args: {
		postId: v.id("posts"),
		caption: v.optional(v.string()),
		brand: v.optional(v.string()),
		model: v.optional(v.string()),
		title: v.optional(v.string()),
		location: v.optional(v.string()),
		eventDate: v.optional(v.string()),
	},
	handler: async (ctx, { postId, ...fields }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		const post = await ctx.db.get(postId);
		if (!post || post.userId !== userId) throw new Error("Not authorized");
		await ctx.db.patch(postId, fields);
	},
});

export const deletePost = mutation({
	args: { postId: v.id("posts") },
	handler: async (ctx, { postId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		const post = await ctx.db.get(postId);
		if (!post || post.userId !== userId) throw new Error("Not authorized");
		const likes = await ctx.db
			.query("postLikes")
			.withIndex("by_post", (q) => q.eq("postId", postId))
			.collect();
		await Promise.all(likes.map((like) => ctx.db.delete(like._id)));
		if (post.imageStorageId) {
			await ctx.storage.delete(post.imageStorageId);
		}
		await ctx.db.delete(postId);
	},
});
