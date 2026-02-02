import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAllSpotted = query({
	handler: async (ctx) => {
		const spotted = await ctx.db.query("spottedCars").order("desc").collect();
		return spotted;
	},
});

export const addSpottedCar = mutation({
	args: { brand: v.string(), model: v.string() },
	handler: async (ctx, args) => {
		await ctx.db.insert("spottedCars", {
			brand: args.brand,
			model: args.model,
		});
	},
});
