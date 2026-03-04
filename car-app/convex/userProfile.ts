import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getProfile = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;
		const profile = await ctx.db
			.query("userProfile")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();
		if (!profile) return null;
		return {
			...profile,
			imageUrl: profile.imageStorageId
				? await ctx.storage.getUrl(profile.imageStorageId)
				: null,
		};
	},
});

export const upsertProfile = mutation({
	args: {
		displayName: v.optional(v.string()),
		imageStorageId: v.optional(v.id("_storage")),
		isPhotographer: v.optional(v.boolean()),
		portfolioUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		const existing = await ctx.db
			.query("userProfile")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();
		if (existing) {
			await ctx.db.patch(existing._id, args);
		} else {
			await ctx.db.insert("userProfile", { ...args, userId });
		}
	},
});

export const getProfileById = query({
	args: { userId: v.id("users") },
	handler: async (ctx, { userId }) => {
		const profile = await ctx.db
			.query("userProfile")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();
		const imageUrl = profile?.imageStorageId
			? await ctx.storage.getUrl(profile.imageStorageId)
			: null;
		return {
			displayName: profile?.displayName ?? "Car Spotter",
			isPhotographer: profile?.isPhotographer ?? false,
			portfolioUrl: profile?.portfolioUrl ?? null,
			imageUrl,
		};
	},
});

export const getCurrentUserId = query({
	handler: async (ctx) => {
		return await getAuthUserId(ctx);
	},
});

export const generateUploadUrl = mutation({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		return await ctx.storage.generateUploadUrl();
	},
});
