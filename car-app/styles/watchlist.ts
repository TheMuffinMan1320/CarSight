import { StyleSheet } from "react-native";
import { shared } from "./shared";

export const styles = StyleSheet.create({
	...shared,

	// Header
	header: {
		flexDirection: "row",
		alignItems: "baseline",
		gap: 8,
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 12,
	},
	headerCount: { fontSize: 15 },

	// List
	list: { paddingHorizontal: 16, paddingBottom: 120 },

	// Row item
	row: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, gap: 12 },
	rowIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
	rowEmoji: { fontSize: 22 },
	brandLogo: { width: 32, height: 32 },
	rowText: { flex: 1 },
	rowBrand: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 2 },
	rowModel: { fontSize: 16, fontWeight: "600" },
	deleteBtn: { padding: 4 },

	separator: { height: 8, marginHorizontal: 0 },
});
