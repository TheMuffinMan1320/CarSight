import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	spottedCars: defineTable({
		brand: v.string(),
		model: v.string(),
	}),
	watchlist: defineTable({
		brand: v.string(),
		model: v.string(),
	}),
});
