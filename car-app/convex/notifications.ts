import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

async function sendPushMessages(messages: object[]) {
	const chunks: object[][] = [];
	for (let i = 0; i < messages.length; i += 100) chunks.push(messages.slice(i, i + 100));
	for (const chunk of chunks) {
		await fetch("https://exp.host/--/api/v2/push/send", {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "application/json", "Accept-Encoding": "gzip, deflate" },
			body: JSON.stringify(chunk),
		});
	}
}

export const getPushTokenForUser = internalQuery({
	args: { userId: v.id("users") },
	handler: async (ctx, { userId }) => {
		const profile = await ctx.db
			.query("userProfile")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();
		return profile?.pushToken ?? null;
	},
});

export const notifyUser = internalAction({
	args: { userId: v.id("users"), title: v.string(), body: v.string() },
	handler: async (ctx, { userId, title, body }) => {
		const token: string | null = await ctx.runQuery(internal.notifications.getPushTokenForUser, { userId });
		if (!token) return;
		await sendPushMessages([{ to: token, title, body, sound: "default" }]);
	},
});

export const getWatchlistPushTokens = internalQuery({
	args: { brand: v.string(), model: v.string(), posterUserId: v.id("users") },
	handler: async (ctx, { brand, model, posterUserId }) => {
		const brandLower = brand.toLowerCase();
		const modelLower = model.toLowerCase();

		// Find all watchlist entries matching this brand+model (excluding the poster)
		const all = await ctx.db.query("watchlist").collect();
		const matched = all.filter(
			(w) =>
				w.userId !== posterUserId &&
				w.brand.toLowerCase() === brandLower &&
				w.model.toLowerCase() === modelLower &&
				w.userId !== undefined
		);

		// Get push tokens for matched users
		const tokens: string[] = [];
		for (const item of matched) {
			if (!item.userId) continue;
			const profile = await ctx.db
				.query("userProfile")
				.withIndex("by_user", (q) => q.eq("userId", item.userId!))
				.first();
			if (profile?.pushToken) {
				tokens.push(profile.pushToken);
			}
		}
		return tokens;
	},
});

export const checkWatchlistAndNotify = internalAction({
	args: {
		brand: v.string(),
		model: v.string(),
		location: v.optional(v.string()),
		posterUserId: v.id("users"),
	},
	handler: async (ctx, { brand, model, location, posterUserId }) => {
		const tokens: string[] = await ctx.runQuery(
			internal.notifications.getWatchlistPushTokens,
			{ brand, model, posterUserId }
		);

		if (tokens.length === 0) return;

		const locationText = location ? ` in ${location}` : "";
		const message = {
			title: "Watchlist Spot!",
			body: `A ${brand} ${model} was just spotted${locationText}`,
			sound: "default" as const,
		};

		// Send via Expo push notification service
		const chunks: string[][] = [];
		for (let i = 0; i < tokens.length; i += 100) {
			chunks.push(tokens.slice(i, i + 100));
		}

		for (const chunk of chunks) {
			const messages = chunk.map((to) => ({ to, ...message }));
			await fetch("https://exp.host/--/api/v2/push/send", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					"Accept-Encoding": "gzip, deflate",
				},
				body: JSON.stringify(messages),
			});
		}
	},
});
