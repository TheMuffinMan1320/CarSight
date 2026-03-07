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

export const getAllSpotted = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];
		const cars = await ctx.db
			.query("spottedCars")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.collect();
		return Promise.all(
			cars.map(async (car) => ({
				...car,
				imageUrl: car.imageStorageId
					? await ctx.storage.getUrl(car.imageStorageId)
					: null,
			}))
		);
	},
});

export const getSpottedCarsByUser = query({
	args: { userId: v.id("users") },
	handler: async (ctx, { userId }) => {
		const cars = await ctx.db
			.query("spottedCars")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.collect();
		return Promise.all(
			cars.map(async (car) => ({
				...car,
				imageUrl: car.imageStorageId ? await ctx.storage.getUrl(car.imageStorageId) : null,
			}))
		);
	},
});

export const addSpottedCar = mutation({
	args: {
		brand: v.string(),
		model: v.string(),
		horsepower: v.optional(v.number()),
		spottedDate: v.optional(v.string()),
		imageStorageId: v.optional(v.id("_storage")),
		price: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		await ctx.db.insert("spottedCars", { ...args, userId });

		// Remove matching watchlist entries (case-insensitive brand + model)
		const watchlist = await ctx.db
			.query("watchlist")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();
		const brandLower = args.brand.toLowerCase();
		const modelLower = args.model.toLowerCase();
		const matches = watchlist.filter(
			(w) => w.brand.toLowerCase() === brandLower && w.model.toLowerCase() === modelLower
		);
		await Promise.all(matches.map((w) => ctx.db.delete(w._id)));
	},
});

export const toggleFavorite = mutation({
	args: { id: v.id("spottedCars") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		const car = await ctx.db.get(args.id);
		if (!car || car.userId !== userId) throw new Error("Unauthorized");
		await ctx.db.patch(args.id, { isFavorite: !car.isFavorite });
	},
});

export const updateSpottedCar = mutation({
	args: {
		id: v.id("spottedCars"),
		brand: v.string(),
		model: v.string(),
		horsepower: v.optional(v.number()),
		spottedDate: v.optional(v.string()),
		price: v.optional(v.number()),
	},
	handler: async (ctx, { id, ...fields }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		const car = await ctx.db.get(id);
		if (!car || car.userId !== userId) throw new Error("Unauthorized");
		await ctx.db.patch(id, fields);
	},
});

export const deleteSpottedCar = mutation({
	args: { id: v.id("spottedCars") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		const car = await ctx.db.get(args.id);
		if (!car || car.userId !== userId) throw new Error("Unauthorized");
		if (car.imageStorageId) {
			await ctx.storage.delete(car.imageStorageId);
		}
		await ctx.db.delete(args.id);
	},
});
