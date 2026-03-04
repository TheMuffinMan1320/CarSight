import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getComments = query({
	args: { postId: v.id("posts") },
	handler: async (ctx, { postId }) => {
		const userId = await getAuthUserId(ctx);
		const comments = await ctx.db
			.query("comments")
			.withIndex("by_post", (q) => q.eq("postId", postId))
			.order("asc")
			.collect();

		return await Promise.all(
			comments.map(async (comment) => {
				const profile = await ctx.db
					.query("userProfile")
					.withIndex("by_user", (q) => q.eq("userId", comment.userId))
					.first();

				const avatarUrl = profile?.imageStorageId
					? await ctx.storage.getUrl(profile.imageStorageId)
					: null;

				return {
					...comment,
					authorName: profile?.displayName ?? "Car Spotter",
					authorAvatarUrl: avatarUrl,
					isOwnComment: userId ? comment.userId === userId : false,
				};
			})
		);
	},
});

export const addComment = mutation({
	args: { postId: v.id("posts"), text: v.string() },
	handler: async (ctx, { postId, text }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		const trimmed = text.trim();
		if (!trimmed) throw new Error("Comment cannot be empty");
		return await ctx.db.insert("comments", { postId, userId, text: trimmed });
	},
});

export const deleteComment = mutation({
	args: { commentId: v.id("comments") },
	handler: async (ctx, { commentId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		const comment = await ctx.db.get(commentId);
		if (!comment || comment.userId !== userId) throw new Error("Not authorized");
		await ctx.db.delete(commentId);
	},
});
