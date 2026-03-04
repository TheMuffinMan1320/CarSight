import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const addSlot = mutation({
	args: {
		date: v.string(),
		startTime: v.string(),
		endTime: v.string(),
		price: v.number(),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		const profile = await ctx.db
			.query("userProfile")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();
		if (!profile?.isPhotographer) throw new Error("Not a photographer");
		return await ctx.db.insert("availability", { photographerId: userId, ...args });
	},
});

export const deleteSlot = mutation({
	args: { slotId: v.id("availability") },
	handler: async (ctx, { slotId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		const slot = await ctx.db.get(slotId);
		if (!slot || slot.photographerId !== userId) throw new Error("Not authorized");
		if (slot.bookedByUserId) throw new Error("Cancel the booking before deleting.");
		await ctx.db.delete(slotId);
	},
});

export const getSlotsForPhotographer = query({
	args: { photographerId: v.id("users") },
	handler: async (ctx, { photographerId }) => {
		const slots = await ctx.db
			.query("availability")
			.withIndex("by_photographer", (q) => q.eq("photographerId", photographerId))
			.collect();

		return await Promise.all(
			slots.map(async (slot) => {
				let clientName: string | null = null;
				let clientAvatarUrl: string | null = null;
				if (slot.bookedByUserId) {
					const cp = await ctx.db
						.query("userProfile")
						.withIndex("by_user", (q) => q.eq("userId", slot.bookedByUserId!))
						.first();
					clientName = cp?.displayName ?? "Car Enthusiast";
					clientAvatarUrl = cp?.imageStorageId
						? await ctx.storage.getUrl(cp.imageStorageId)
						: null;
				}
				return { ...slot, clientName, clientAvatarUrl };
			})
		);
	},
});

export const bookSlot = mutation({
	args: { slotId: v.id("availability") },
	handler: async (ctx, { slotId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		const slot = await ctx.db.get(slotId);
		if (!slot) throw new Error("Slot not found");
		if (slot.bookedByUserId) throw new Error("Slot already booked");
		if (slot.photographerId === userId) throw new Error("Cannot book your own slot");
		await ctx.db.patch(slotId, { bookedByUserId: userId });
	},
});

export const cancelSlotBooking = mutation({
	args: { slotId: v.id("availability") },
	handler: async (ctx, { slotId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Unauthorized");
		const slot = await ctx.db.get(slotId);
		if (!slot) throw new Error("Slot not found");
		if (slot.bookedByUserId !== userId && slot.photographerId !== userId) {
			throw new Error("Not authorized");
		}
		await ctx.db.patch(slotId, { bookedByUserId: undefined });
	},
});
