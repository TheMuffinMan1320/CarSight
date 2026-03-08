import type { Id } from "@/convex/_generated/dataModel";

export type PostType = "spotted_car" | "car_meet" | "photography";

export type FeedPost = {
	_id: Id<"posts">;
	userId: Id<"users">;
	type: PostType;
	caption?: string;
	imageUrl: string | null;
	brand?: string;
	model?: string;
	title?: string;
	location?: string;
	eventDate?: string;
	authorName: string;
	authorAvatarUrl: string | null;
	isPhotographer: boolean;
	likeCount: number;
	commentCount: number;
	isLiked: boolean;
	isOwnPost: boolean;
	_creationTime: number;
};

export const POST_TYPE_CONFIG = {
	spotted_car: { label: "Car Spot", icon: "🚗", color: "#0a7ea4" },
	car_meet: { label: "Car Meet", icon: "🏁", color: "#E85D04" },
	photography: { label: "Photography", icon: "📸", color: "#C9A84C" },
} as const;

export function timeAgo(ms: number) {
	const diff = Date.now() - ms;
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d`;
	return `${Math.floor(days / 7)}w`;
}
