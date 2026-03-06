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
		pushToken: v.optional(v.string()),
	}).index("by_user", ["userId"]),
	posts: defineTable({
		userId: v.id("users"),
		type: v.union(
			v.literal("spotted_car"),
			v.literal("car_meet"),
			v.literal("photography")
		),
		caption: v.optional(v.string()),
		imageStorageId: v.optional(v.id("_storage")),
		brand: v.optional(v.string()),
		model: v.optional(v.string()),
		title: v.optional(v.string()),
		location: v.optional(v.string()),
		eventDate: v.optional(v.string()),
	}).index("by_user", ["userId"]),
	follows: defineTable({
		followerId: v.id("users"),
		followingId: v.id("users"),
	})
		.index("by_follower", ["followerId"])
		.index("by_following", ["followingId"])
		.index("by_follower_following", ["followerId", "followingId"]),
	postLikes: defineTable({
		postId: v.id("posts"),
		userId: v.id("users"),
	})
		.index("by_post", ["postId"])
		.index("by_user_post", ["userId", "postId"]),
	comments: defineTable({
		postId: v.id("posts"),
		userId: v.id("users"),
		text: v.string(),
	}).index("by_post", ["postId"]),
	availability: defineTable({
		photographerId: v.id("users"),
		date: v.string(), // "YYYY-MM-DD"
		startTime: v.string(), // "HH:MM" 24-hr
		endTime: v.string(), // "HH:MM" 24-hr
		price: v.number(),
		description: v.optional(v.string()),
		bookedByUserId: v.optional(v.id("users")),
	})
		.index("by_photographer", ["photographerId"])
		.index("by_photographer_date", ["photographerId", "date"]),
});
