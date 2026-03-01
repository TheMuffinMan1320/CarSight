import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
	...authTables,
	spottedCars: defineTable({
		userId: v.optional(v.id("users")),
		brand: v.string(),
		model: v.string(),
		horsepower: v.optional(v.number()),
		spottedDate: v.optional(v.string()),
		imageStorageId: v.optional(v.id("_storage")),
		price: v.optional(v.number()),
		isFavorite: v.optional(v.boolean()),
	}).index("by_user", ["userId"]),
	watchlist: defineTable({
		userId: v.optional(v.id("users")),
		brand: v.string(),
		model: v.string(),
	}).index("by_user", ["userId"]),
	userProfile: defineTable({
		userId: v.optional(v.id("users")),
		displayName: v.optional(v.string()),
		imageStorageId: v.optional(v.id("_storage")),
		isPhotographer: v.optional(v.boolean()),
		portfolioUrl: v.optional(v.string()),
	}).index("by_user", ["userId"]),
});
