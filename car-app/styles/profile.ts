import { StyleSheet } from "react-native";
import { shared } from "./shared";

const CHART_BAR_HEIGHT = 110;

export const styles = StyleSheet.create({
	...shared,

	scroll: { paddingBottom: 40 },

	header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },

	// Avatar
	avatarSection: { alignItems: "center", paddingTop: 12, paddingBottom: 28 },
	avatar: {
		width: 90,
		height: 90,
		borderRadius: 45,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
	},
	avatarImage: { width: 90, height: 90 },
	avatarInitial: { fontSize: 36, fontWeight: "700" },
	avatarOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.45)",
		justifyContent: "center",
		alignItems: "center",
	},
	cameraBadge: {
		position: "absolute",
		bottom: 0,
		right: 0,
		width: 28,
		height: 28,
		borderRadius: 14,
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 2,
	},
	nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
	displayName: { fontSize: 22, fontWeight: "700" },

	// Section
	sectionTitle: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1.2,
		paddingHorizontal: 16,
		marginTop: 24,
		marginBottom: 10,
	},

	// Card
	card: {
		marginHorizontal: 16,
		borderRadius: 20,
		padding: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 2,
	},

	// Stats
	statsRow: { flexDirection: "row", alignItems: "center" },
	statItem: { flex: 1, alignItems: "center", paddingVertical: 4 },
	statValue: { fontSize: 26, fontWeight: "700", marginBottom: 3 },
	statLabel: { fontSize: 12, fontWeight: "500" },
	statDivider: { width: 1, height: 36 },

	// Chart
	chartWrap: { flexDirection: "row", alignItems: "flex-end", gap: 6, paddingTop: 8 },
	barCol: { flex: 1, alignItems: "center", gap: 4 },
	barValue: { fontSize: 10, fontWeight: "600" },
	barTrack: {
		width: "100%",
		height: CHART_BAR_HEIGHT,
		borderRadius: 8,
		justifyContent: "flex-end",
		overflow: "hidden",
	},
	barFill: { width: "100%", borderRadius: 8 },
	barMonth: { fontSize: 11, fontWeight: "500", marginTop: 4 },
	chartEmpty: { textAlign: "center", paddingVertical: 28, fontSize: 14 },

	// Photographer
	photographerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
	photographerLabel: { flex: 1 },
	photographerTitle: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
	photographerSub: { fontSize: 13 },
	portfolioSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
	portfolioLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10 },
	portfolioInputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
	portfolioInput: { flex: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
	visitBtn: { width: 46, height: 46, borderRadius: 12, justifyContent: "center", alignItems: "center" },

	// Modal (re-uses shared modalOverlay, modalSheet, modalTitle, modalBtnRow, modalBtn, cancelBtn, saveBtn, etc.)
	modalInput: {
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		marginBottom: 12,
	},
});
