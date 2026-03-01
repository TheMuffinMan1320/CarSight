import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	spottedCars: defineTable({
		brand: v.string(),
		model: v.string(),
		horsepower: v.optional(v.number()),
		spottedDate: v.optional(v.string()),
		imageStorageId: v.optional(v.id("_storage")),
		price: v.optional(v.number()),
	}),
	watchlist: defineTable({
		brand: v.string(),
		model: v.string(),
	}),
});
