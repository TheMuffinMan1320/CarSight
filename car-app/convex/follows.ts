import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const followUser = mutation({
	args: { targetUserId: v.id("users") },
	handler: async (ctx, { targetUserId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		if (userId === targetUserId) return;

		const existing = await ctx.db
			.query("follows")
			.withIndex("by_follower_following", (q) =>
				q.eq("followerId", userId).eq("followingId", targetUserId)
			)
			.first();

		if (!existing) {
			await ctx.db.insert("follows", {
				followerId: userId,
				followingId: targetUserId,
			});
		}
	},
});

export const unfollowUser = mutation({
	args: { targetUserId: v.id("users") },
	handler: async (ctx, { targetUserId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");

		const existing = await ctx.db
			.query("follows")
			.withIndex("by_follower_following", (q) =>
				q.eq("followerId", userId).eq("followingId", targetUserId)
			)
			.first();

		if (existing) {
			await ctx.db.delete(existing._id);
		}
	},
});

export const isFollowing = query({
	args: { targetUserId: v.id("users") },
	handler: async (ctx, { targetUserId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return false;

		const existing = await ctx.db
			.query("follows")
			.withIndex("by_follower_following", (q) =>
				q.eq("followerId", userId).eq("followingId", targetUserId)
			)
			.first();

		return !!existing;
	},
});

export const getFollowerCount = query({
	args: { targetUserId: v.id("users") },
	handler: async (ctx, { targetUserId }) => {
		const docs = await ctx.db
			.query("follows")
			.withIndex("by_following", (q) => q.eq("followingId", targetUserId))
			.collect();
		return docs.length;
	},
});

export const getFollowingCount = query({
	args: { userId: v.id("users") },
	handler: async (ctx, { userId }) => {
		const docs = await ctx.db
			.query("follows")
			.withIndex("by_follower", (q) => q.eq("followerId", userId))
			.collect();
		return docs.length;
	},
});
