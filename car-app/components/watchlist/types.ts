import { Id } from "@/convex/_generated/dataModel";

export type WatchItem = {
	_id: Id<"watchlist">;
	brand: string;
	model: string;
};

export function getBrandLogoUrl(brand: string): string {
	const normalized = brand.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
	return `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/${normalized}.png`;
}
