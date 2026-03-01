import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getAllWatch = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];
		return await ctx.db
			.query("watchlist")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.collect();
	},
});

export const addWatchCar = mutation({
	args: { brand: v.string(), model: v.string() },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		await ctx.db.insert("watchlist", { brand: args.brand, model: args.model, userId });
	},
});

export const deleteWatchCar = mutation({
	args: { id: v.id("watchlist") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		const item = await ctx.db.get(args.id);
		if (!item || item.userId !== userId) throw new Error("Unauthorized");
		await ctx.db.delete(args.id);
	},
});
