import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAllWatch = query({
	handler: async (ctx) => {
		const spotted = await ctx.db.query("watchlist").order("desc").collect();
		return spotted;
	},
});

export const addWatchCar = mutation({
	args: { brand: v.string(), model: v.string() },
	handler: async (ctx, args) => {
		await ctx.db.insert("watchlist", {
			brand: args.brand,
			model: args.model,
		});
	},
});

export const deleteWatchCar = mutation({
	args: { id: v.id("watchlist") },
	handler: async (convexToJson, args) => {
		await convexToJson.db.delete(args.id);
	},
});
