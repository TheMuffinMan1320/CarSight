import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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
		return await ctx.db.insert("posts", { userId, ...args });
	},
});

export const getFeedPosts = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		const posts = await ctx.db.query("posts").order("desc").take(50);

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
