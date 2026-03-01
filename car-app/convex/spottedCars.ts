import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
	handler: async (ctx) => {
		return await ctx.storage.generateUploadUrl();
	},
});

export const getAllSpotted = query({
	handler: async (ctx) => {
		const cars = await ctx.db.query("spottedCars").order("desc").collect();
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

export const addSpottedCar = mutation({
	args: {
		brand: v.string(),
		model: v.string(),
		horsepower: v.number(),
		spottedDate: v.string(),
		imageStorageId: v.optional(v.id("_storage")),
		price: v.number(),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("spottedCars", args);
	},
});

export const deleteSpottedCar = mutation({
	args: { id: v.id("spottedCars") },
	handler: async (ctx, args) => {
		const car = await ctx.db.get(args.id);
		if (car?.imageStorageId) {
			await ctx.storage.delete(car.imageStorageId);
		}
		await ctx.db.delete(args.id);
	},
});
