import { Id } from "@/convex/_generated/dataModel";

export type SpottedCar = {
	_id: Id<"spottedCars">;
	brand: string;
	model: string;
	horsepower?: number;
	spottedDate?: string;
	price?: number;
	isFavorite?: boolean;
	imageUrl: string | null;
};

export type SortKey = "date" | "name" | "horsepower" | "price";
export type SortDir = "asc" | "desc";

export const SORT_OPTIONS: { key: SortKey; label: string; defaultDir: SortDir }[] = [
	{ key: "date", label: "Date", defaultDir: "desc" },
	{ key: "name", label: "Name", defaultDir: "asc" },
	{ key: "horsepower", label: "HP", defaultDir: "desc" },
	{ key: "price", label: "Price", defaultDir: "desc" },
];

export function formatPriceCompact(price: number): string {
	if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
	if (price >= 1_000) return `$${Math.round(price / 1_000)}K`;
	return `$${price}`;
}
