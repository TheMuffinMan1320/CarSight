/**
 * Shared raw style definitions to be spread into each screen's StyleSheet.create.
 * Use `as const` on string-literal values so TypeScript treats them as the required literal types.
 */

export const shared = {
  // ─── Layout ────────────────────────────────────────────────────────────────
  container: { flex: 1 },

  // ─── FAB ───────────────────────────────────────────────────────────────────
  fab: {
    position: "absolute" as const,
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 8,
  },

  // ─── Header ────────────────────────────────────────────────────────────────
  headerTitle: { fontSize: 28, fontWeight: "700" as const },

  // ─── Empty state ───────────────────────────────────────────────────────────
  centered: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    marginBottom: 8,
    textAlign: "center" as const,
  },
  emptyHint: { fontSize: 15, textAlign: "center" as const },

  // ─── Input ─────────────────────────────────────────────────────────────────
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },

  // ─── Bottom-sheet modal ────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end" as const,
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
  },
  modalTitle: { fontSize: 22, fontWeight: "700" as const, marginBottom: 16 },
  modalBtnRow: { flexDirection: "row" as const, gap: 12, marginTop: 4 },
  modalBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center" as const,
  },

  // ─── Buttons ───────────────────────────────────────────────────────────────
  cancelBtn: { backgroundColor: "rgba(128,128,128,0.12)" },
  saveBtn: {},
  cancelBtnText: { fontSize: 16, fontWeight: "600" as const },
  saveBtnText: { fontSize: 16, fontWeight: "600" as const },
};
