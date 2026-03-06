import { Dimensions, StyleSheet } from "react-native";
import { shared } from "./shared";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

export const styles = StyleSheet.create({
	...shared,

	// Header
	header: {
		flexDirection: "row",
		alignItems: "baseline",
		gap: 8,
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 10,
	},
	headerCount: { fontSize: 15 },

	// Search bar
	searchBarWrap: {
		flexDirection: "row",
		alignItems: "center",
		marginHorizontal: 16,
		marginTop: 10,
		marginBottom: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 12,
		gap: 8,
	},
	searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

	// Favorites chip
	filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
	filterChipText: { fontSize: 13, fontWeight: "600" },

	// Sort bar
	sortBarWrap: { paddingVertical: 4, marginBottom: 8 },
	sortBar: { paddingHorizontal: 16, gap: 4 },
	sortChip: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 5,
		borderRadius: 10,
	},
	sortChipText: { fontSize: 13, fontWeight: "600" },
	sortArrow: { fontSize: 13, fontWeight: "700" },

	// Grid
	grid: { paddingHorizontal: 16, paddingBottom: 120 },
	gridRow: { gap: 16, marginBottom: 16 },

	// Card
	card: {
		width: CARD_WIDTH,
		height: CARD_HEIGHT,
		borderRadius: 18,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.14,
		shadowRadius: 10,
		elevation: 5,
	},
	cardImageWrap: { width: CARD_WIDTH, height: CARD_HEIGHT * 0.64, position: "relative" },
	cardImage: { width: "100%", height: "100%" },
	cardImagePlaceholder: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
	placeholderEmoji: { fontSize: 40 },
	brandStrip: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		backgroundColor: "rgba(0,0,0,0.52)",
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	brandStripText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
	cardFooter: { flex: 1, paddingHorizontal: 10, paddingVertical: 9, justifyContent: "space-between" },
	cardModel: { fontSize: 13, fontWeight: "700" },
	cardStats: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
	statPill: { flexDirection: "row", alignItems: "center", gap: 2 },
	statPillEmoji: { fontSize: 10 },
	statPillText: { fontSize: 11, fontWeight: "500" },

	// Star button on card
	starBtn: {
		position: "absolute",
		bottom: 6,
		right: 6,
		width: 26,
		height: 26,
		borderRadius: 13,
		backgroundColor: "rgba(0,0,0,0.4)",
		justifyContent: "center",
		alignItems: "center",
	},

	// Detail modal
	detailOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
	detailSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
	detailImageWrap: { width: "100%", height: 280, position: "relative" },
	detailImage: { width: "100%", height: "100%" },
	detailImagePlaceholder: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
	detailPlaceholderEmoji: { fontSize: 80 },
	closeBtn: {
		position: "absolute",
		top: 16,
		right: 16,
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: "rgba(0,0,0,0.48)",
		justifyContent: "center",
		alignItems: "center",
	},
	closeBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
	detailBody: { padding: 24, paddingBottom: 36 },
	detailBrand: { fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 4 },
	detailModel: { fontSize: 26, fontWeight: "800", marginBottom: 20 },
	divider: { height: 1, marginBottom: 20 },
	statsRow: { flexDirection: "row", justifyContent: "space-around" },
	statItem: { flex: 1, alignItems: "center", gap: 5 },
	statEmoji: { fontSize: 22 },
	statLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2 },
	statValue: { fontSize: 13, fontWeight: "700", textAlign: "center" },
	statDivider: { width: 1, alignSelf: "stretch", marginVertical: 4 },

	// Add car modal
	addOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
	addSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "90%" },
	addSheetContent: { padding: 24, paddingBottom: 44 },
	addTitle: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
	photoPicker: { width: "100%", height: 150, borderRadius: 16, overflow: "hidden", marginBottom: 14 },
	photoPickerInner: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
	photoPickerEmoji: { fontSize: 34 },
	photoPickerHint: { fontSize: 14 },
	addBtnRow: { flexDirection: "row", gap: 12, marginTop: 4 },
	addBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
});
