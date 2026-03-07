import React, { useState, useMemo } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Modal,
	TextInput,
	ScrollView,
	FlatList,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ActivityIndicator,
	Alert,
	StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { IconSymbol } from "@/components/ui/icon-symbol";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December",
];
const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const TIME_OPTIONS: string[] = Array.from({ length: 33 }, (_, i) => {
	const total = 6 * 60 + i * 30;
	return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
});

function buildCalendar(year: number, month: number): (number | null)[] {
	const firstDay = new Date(year, month, 1).getDay();
	const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday-first
	const count = new Date(year, month + 1, 0).getDate();
	const days: (number | null)[] = Array(offset).fill(null);
	for (let d = 1; d <= count; d++) days.push(d);
	return days;
}

function toDateStr(y: number, m: number, d: number) {
	return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function formatTime(t: string) {
	const [h, m] = t.split(":").map(Number);
	return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function formatDate(s: string) {
	const [y, m, d] = s.split("-").map(Number);
	return new Date(y, m - 1, d).toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
	});
}

function formatPrice(price: number) {
	return price % 1 === 0 ? `$${price}` : `$${price.toFixed(2)}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
	photographerId: Id<"users">;
	isOwner: boolean;
	currentUserId: Id<"users"> | null;
	isDark: boolean;
	tint: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PhotographerCalendar({
	photographerId,
	isOwner,
	currentUserId,
	isDark,
	tint,
}: Props) {
	const now = new Date();
	const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

	const [year, setYear] = useState(now.getFullYear());
	const [month, setMonth] = useState(now.getMonth());
	const [selectedDate, setSelectedDate] = useState<string | null>(null);

	// Add slot form state
	const [showAddSlot, setShowAddSlot] = useState(false);
	const [startTime, setStartTime] = useState("09:00");
	const [endTime, setEndTime] = useState("11:00");
	const [price, setPrice] = useState("");
	const [description, setDescription] = useState("");
	const [pickerMode, setPickerMode] = useState<"start" | "end" | null>(null);
	const [adding, setAdding] = useState(false);

	// Booking phone flow
	const [bookingSlotId, setBookingSlotId] = useState<Id<"availability"> | null>(null);
	const [bookingPhone, setBookingPhone] = useState("");
	const [booking, setBooking] = useState(false);

	const slots = useQuery(api.availability.getSlotsForPhotographer, { photographerId });
	const addSlotMut = useMutation(api.availability.addSlot);
	const deleteSlotMut = useMutation(api.availability.deleteSlot);
	const bookSlotMut = useMutation(api.availability.bookSlot);
	const cancelMut = useMutation(api.availability.cancelSlotBooking);

	// Colors
	const cardBg = isDark ? "#1C1C2E" : "#FFFFFF";
	const surfaceBg = isDark ? "#252538" : "#F5F5F8";
	const textPrimary = isDark ? "#ECEDEE" : "#11181C";
	const textSecondary = isDark ? "#9BA1A6" : "#687076";
	const borderColor = isDark ? "#252538" : "#F0F0F4";

	// Group slots by date
	const slotsByDate = useMemo(() => {
		const map: Record<string, NonNullable<typeof slots>> = {};
		if (!slots) return map;
		for (const s of slots) {
			if (!map[s.date]) map[s.date] = [];
			map[s.date]!.push(s);
		}
		return map;
	}, [slots]);

	const selectedSlots = useMemo(
		() =>
			selectedDate
				? [...(slotsByDate[selectedDate] ?? [])].sort((a, b) =>
						a.startTime.localeCompare(b.startTime)
				  )
				: [],
		[selectedDate, slotsByDate]
	);

	const calDays = buildCalendar(year, month);
	const calRows: (number | null)[][] = [];
	for (let i = 0; i < calDays.length; i += 7) {
		const row = calDays.slice(i, i + 7);
		while (row.length < 7) row.push(null);
		calRows.push(row);
	}

	// Navigation
	const prevMonth = () => {
		setSelectedDate(null);
		if (month === 0) { setMonth(11); setYear((y) => y - 1); }
		else setMonth((m) => m - 1);
	};
	const nextMonth = () => {
		setSelectedDate(null);
		if (month === 11) { setMonth(0); setYear((y) => y + 1); }
		else setMonth((m) => m + 1);
	};

	// Handlers
	const handleAddSlot = async () => {
		if (!selectedDate) return;
		const p = parseFloat(price);
		if (!price.trim() || isNaN(p) || p < 0) {
			Alert.alert("Invalid price", "Please enter a valid price.");
			return;
		}
		if (startTime >= endTime) {
			Alert.alert("Invalid times", "End time must be after start time.");
			return;
		}
		setAdding(true);
		try {
			await addSlotMut({
				date: selectedDate,
				startTime,
				endTime,
				price: p,
				description: description.trim() || undefined,
			});
			setShowAddSlot(false);
			setPrice("");
			setDescription("");
			setStartTime("09:00");
			setEndTime("11:00");
		} catch (e: any) {
			Alert.alert("Error", e.message ?? "Failed to add slot.");
		} finally {
			setAdding(false);
		}
	};

	const handleDelete = (slotId: Id<"availability">) => {
		Alert.alert("Delete Slot", "Remove this availability slot?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => deleteSlotMut({ slotId }).catch((e) => Alert.alert("Error", e.message)),
			},
		]);
	};

	const handleBook = (slotId: Id<"availability">) => {
		setBookingSlotId(slotId);
		setBookingPhone("");
	};

	const confirmBook = async () => {
		if (!bookingSlotId) return;
		const phone = bookingPhone.trim();
		if (!phone) {
			Alert.alert("Phone required", "Please enter your phone number.");
			return;
		}
		setBooking(true);
		try {
			await bookSlotMut({ slotId: bookingSlotId, phone });
			setBookingSlotId(null);
		} catch (e: any) {
			Alert.alert("Error", e.message ?? "Failed to book.");
		} finally {
			setBooking(false);
		}
	};

	const handleCancel = (slotId: Id<"availability">) => {
		Alert.alert("Cancel Booking", "Cancel this booking?", [
			{ text: "No", style: "cancel" },
			{
				text: "Yes, Cancel",
				style: "destructive",
				onPress: () => cancelMut({ slotId }).catch((e) => Alert.alert("Error", e.message)),
			},
		]);
	};

	const isPastDate = (d: string) => d < todayStr;

	return (
		<View style={[s.container, { backgroundColor: cardBg }]}>
			{/* ── Month header ── */}
			<View style={s.monthHeader}>
				<TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
					<IconSymbol name="chevron.left" size={20} color={tint} />
				</TouchableOpacity>
				<Text style={[s.monthTitle, { color: textPrimary }]}>
					{MONTHS[month]} {year}
				</Text>
				<TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
					<IconSymbol name="chevron.right" size={20} color={tint} />
				</TouchableOpacity>
			</View>

			{/* ── Day-of-week labels ── */}
			<View style={s.dowRow}>
				{DOW.map((d) => (
					<View key={d} style={s.dowCell}>
						<Text style={[s.dowText, { color: textSecondary }]}>{d}</Text>
					</View>
				))}
			</View>

			{/* ── Calendar grid ── */}
			{calRows.map((row, ri) => (
				<View key={ri} style={s.calRow}>
					{row.map((day, ci) => {
						if (!day) return <View key={ci} style={s.calCell} />;
						const ds = toDateStr(year, month, day);
						const hasSlots = !!slotsByDate[ds]?.length;
						const isSelected = ds === selectedDate;
						const isToday = ds === todayStr;
						const isPast = ds < todayStr;
						return (
							<TouchableOpacity
								key={ci}
								style={s.calCell}
								onPress={() => setSelectedDate(isSelected ? null : ds)}
								activeOpacity={0.7}
							>
								<View
									style={[
										s.calDayCircle,
										isSelected && { backgroundColor: tint },
										isToday && !isSelected && { borderWidth: 1.5, borderColor: tint },
									]}
								>
									<Text
										style={[
											s.calDayText,
											{
												color: isSelected
													? (isDark ? "#11181C" : "#FFFFFF")
													: isPast
													? isDark ? "#4A5568" : "#C0C0C8"
													: textPrimary,
											},
											isToday && !isSelected && { color: tint, fontWeight: "700" },
										]}
									>
										{day}
									</Text>
								</View>
								{hasSlots ? (
									<View style={[s.slotDot, { backgroundColor: isSelected ? (isDark ? "#11181C" : "#FFFFFF") : tint }]} />
								) : (
									<View style={s.slotDotPlaceholder} />
								)}
							</TouchableOpacity>
						);
					})}
				</View>
			))}

			{/* ── Selected date panel ── */}
			{selectedDate ? (
				<View style={[s.selectedPanel, { borderTopColor: borderColor }]}>
					<View style={s.selectedHeader}>
						<Text style={[s.selectedDateLabel, { color: textPrimary }]}>
							{formatDate(selectedDate)}
						</Text>
						{isOwner && !isPastDate(selectedDate) ? (
							<TouchableOpacity
								style={[s.addSlotBtn, { backgroundColor: tint }]}
								onPress={() => setShowAddSlot(true)}
								activeOpacity={0.8}
							>
								<IconSymbol name="plus" size={13} color={isDark ? "#11181C" : "#FFFFFF"} />
								<Text style={[s.addSlotBtnText, { color: isDark ? "#11181C" : "#FFFFFF" }]}>
									Add Slot
								</Text>
							</TouchableOpacity>
						) : null}
					</View>

					{slots === undefined ? (
						<ActivityIndicator color={tint} style={{ paddingVertical: 20 }} />
					) : selectedSlots.length === 0 ? (
						<Text style={[s.emptySlots, { color: textSecondary }]}>
							{isOwner ? "No slots for this day — tap Add Slot to create one" : "No available slots for this day"}
						</Text>
					) : (
						selectedSlots.map((slot) => {
							const isBooked = !!slot.bookedByUserId;
							const isMyBooking = slot.bookedByUserId === currentUserId;
							return (
								<View
									key={slot._id}
									style={[
										s.slotCard,
										{
											backgroundColor: surfaceBg,
											borderLeftColor: isBooked ? (isDark ? "#3A3A4E" : "#D1D1D6") : tint,
										},
									]}
								>
									<View style={s.slotTop}>
										<Text style={[s.slotTime, { color: textPrimary }]}>
											{formatTime(slot.startTime)} – {formatTime(slot.endTime)}
										</Text>
										<Text style={[s.slotPrice, { color: tint }]}>
											{formatPrice(slot.price)}
										</Text>
									</View>
									{slot.description ? (
										<Text style={[s.slotDesc, { color: textSecondary }]}>
											{slot.description}
										</Text>
									) : null}

									{/* Owner view */}
									{isOwner ? (
										<View style={s.slotFooter}>
											{isBooked ? (
												<View style={s.bookedRow}>
													{slot.clientAvatarUrl ? (
														<Image
															source={{ uri: slot.clientAvatarUrl }}
															style={s.clientAvatar}
															contentFit="cover"
														/>
													) : (
														<View style={[s.clientAvatar, s.clientAvatarFallback, { backgroundColor: tint + "30" }]}>
															<Text style={[s.clientAvatarInitial, { color: tint }]}>
																{(slot.clientName ?? "?").charAt(0).toUpperCase()}
															</Text>
														</View>
													)}
													<View>
														<Text style={[s.bookedByText, { color: textSecondary }]}>
															Booked by{" "}
															<Text style={{ color: textPrimary, fontWeight: "700" }}>
																{slot.clientName}
															</Text>
														</Text>
														{slot.clientPhone ? (
															<Text style={[s.bookedByText, { color: textSecondary, marginTop: 1 }]}>
																📞 {slot.clientPhone}
															</Text>
														) : null}
													</View>
												</View>
											) : (
												<View style={[s.availablePill, { backgroundColor: tint + "18" }]}>
													<Text style={[s.availableText, { color: tint }]}>Available</Text>
												</View>
											)}
											<TouchableOpacity
												onPress={() => isBooked ? handleCancel(slot._id) : handleDelete(slot._id)}
												hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
											>
												<Text style={s.dangerText}>
													{isBooked ? "Cancel" : "Delete"}
												</Text>
											</TouchableOpacity>
										</View>
									) : (
										// Client view
										<View style={s.slotFooter}>
											{isBooked ? (
												isMyBooking ? (
													<TouchableOpacity onPress={() => handleCancel(slot._id)}>
														<Text style={s.dangerText}>Cancel My Booking</Text>
													</TouchableOpacity>
												) : (
													<View style={[s.bookedPill, { backgroundColor: isDark ? "#3A3A4E" : "#F0F0F4" }]}>
														<Text style={[s.bookedPillText, { color: textSecondary }]}>
															Already Booked
														</Text>
													</View>
												)
											) : !isPastDate(selectedDate) ? (
												<TouchableOpacity
													style={[s.bookBtn, { backgroundColor: tint }]}
													onPress={() => handleBook(slot._id)}
													activeOpacity={0.8}
												>
													<Text style={[s.bookBtnText, { color: isDark ? "#11181C" : "#FFFFFF" }]}>
														Book Now
													</Text>
												</TouchableOpacity>
											) : null}
										</View>
									)}
								</View>
							);
						})
					)}
				</View>
			) : null}

			{/* ── Book Slot Modal (phone input) ── */}
		<Modal
			visible={bookingSlotId !== null}
			animationType="slide"
			transparent
			presentationStyle="overFullScreen"
			onRequestClose={() => setBookingSlotId(null)}
		>
			<KeyboardAvoidingView
				style={m.overlay}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<View style={[m.sheet, { backgroundColor: isDark ? "#151718" : "#FFFFFF" }]}>
					<View style={m.header}>
						<TouchableOpacity onPress={() => setBookingSlotId(null)}>
							<Text style={[m.headerBtn, { color: textSecondary }]}>Cancel</Text>
						</TouchableOpacity>
						<Text style={[m.headerTitle, { color: textPrimary }]}>Book Session</Text>
						<TouchableOpacity onPress={confirmBook} disabled={booking}>
							{booking ? (
								<ActivityIndicator size="small" color={tint} />
							) : (
								<Text style={[m.headerBtn, { color: tint, fontWeight: "700" }]}>Confirm</Text>
							)}
						</TouchableOpacity>
					</View>
					<View style={{ paddingHorizontal: 20, paddingBottom: 40, gap: 8 }}>
						<Text style={[m.label, { color: textSecondary }]}>YOUR PHONE NUMBER</Text>
						<TextInput
							style={[m.input, { backgroundColor: isDark ? "#252538" : "#F5F5F8", color: textPrimary }]}
							placeholder="e.g. +1 555 000 1234"
							placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
							value={bookingPhone}
							onChangeText={setBookingPhone}
							keyboardType="phone-pad"
							returnKeyType="done"
							autoFocus
						/>
						<Text style={[{ fontSize: 12, color: textSecondary, lineHeight: 17 }]}>
							Your number will be shared with the photographer so they can contact you.
						</Text>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>

		{/* ── Add Slot Modal ── */}
			<Modal
				visible={showAddSlot}
				animationType="slide"
				transparent
				presentationStyle="overFullScreen"
				onRequestClose={() => setShowAddSlot(false)}
			>
				<KeyboardAvoidingView
					style={m.overlay}
					behavior={Platform.OS === "ios" ? "padding" : undefined}
				>
					<View style={[m.sheet, { backgroundColor: isDark ? "#151718" : "#FFFFFF" }]}>
						{/* Header */}
						<View style={m.header}>
							<TouchableOpacity onPress={() => setShowAddSlot(false)}>
								<Text style={[m.headerBtn, { color: textSecondary }]}>Cancel</Text>
							</TouchableOpacity>
							<Text style={[m.headerTitle, { color: textPrimary }]}>Add Time Slot</Text>
							<TouchableOpacity onPress={handleAddSlot} disabled={adding}>
								{adding ? (
									<ActivityIndicator size="small" color={tint} />
								) : (
									<Text style={[m.headerBtn, { color: tint, fontWeight: "700" }]}>Add</Text>
								)}
							</TouchableOpacity>
						</View>

						<ScrollView
							contentContainerStyle={m.body}
							showsVerticalScrollIndicator={false}
							keyboardShouldPersistTaps="handled"
						>
							{/* Date (read-only) */}
							<Text style={[m.label, { color: textSecondary }]}>DATE</Text>
							<View style={[m.readonlyRow, { backgroundColor: surfaceBg }]}>
								<Text style={[m.readonlyText, { color: textPrimary }]}>
									{selectedDate ? formatDate(selectedDate) : "—"}
								</Text>
							</View>

							{/* Start time */}
							<Text style={[m.label, { color: textSecondary }]}>START TIME</Text>
							<TouchableOpacity
								style={[m.pickerRow, { backgroundColor: surfaceBg }]}
								onPress={() => setPickerMode("start")}
								activeOpacity={0.8}
							>
								<Text style={[m.pickerText, { color: textPrimary }]}>
									{formatTime(startTime)}
								</Text>
								<IconSymbol name="chevron.down" size={16} color={textSecondary} />
							</TouchableOpacity>

							{/* End time */}
							<Text style={[m.label, { color: textSecondary }]}>END TIME</Text>
							<TouchableOpacity
								style={[m.pickerRow, { backgroundColor: surfaceBg }]}
								onPress={() => setPickerMode("end")}
								activeOpacity={0.8}
							>
								<Text style={[m.pickerText, { color: textPrimary }]}>
									{formatTime(endTime)}
								</Text>
								<IconSymbol name="chevron.down" size={16} color={textSecondary} />
							</TouchableOpacity>

							{/* Price */}
							<Text style={[m.label, { color: textSecondary }]}>PRICE (USD)</Text>
							<TextInput
								style={[m.input, { backgroundColor: surfaceBg, color: textPrimary }]}
								placeholder="e.g. 150"
								placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
								value={price}
								onChangeText={setPrice}
								keyboardType="numeric"
								returnKeyType="done"
							/>

							{/* Description */}
							<Text style={[m.label, { color: textSecondary }]}>DESCRIPTION (optional)</Text>
							<TextInput
								style={[m.input, m.textArea, { backgroundColor: surfaceBg, color: textPrimary }]}
								placeholder="e.g. Golden hour shoot, street cars welcome"
								placeholderTextColor={isDark ? "#4A5568" : "#A0AEC0"}
								value={description}
								onChangeText={setDescription}
								multiline
								textAlignVertical="top"
							/>
						</ScrollView>
					</View>
				</KeyboardAvoidingView>

				{/* Time picker sub-modal */}
				{pickerMode ? (
					<Modal
						visible
						transparent
						animationType="fade"
						onRequestClose={() => setPickerMode(null)}
					>
						<Pressable
							style={tp.backdrop}
							onPress={() => setPickerMode(null)}
						>
							<Pressable style={[tp.sheet, { backgroundColor: isDark ? "#1C1C2E" : "#FFFFFF" }]}>
								<Text style={[tp.title, { color: textPrimary }]}>
									{pickerMode === "start" ? "Start Time" : "End Time"}
								</Text>
								<FlatList
									data={TIME_OPTIONS}
									keyExtractor={(t) => t}
									style={{ maxHeight: 260 }}
									showsVerticalScrollIndicator={false}
									renderItem={({ item }) => {
										const selected =
											pickerMode === "start" ? startTime === item : endTime === item;
										return (
											<TouchableOpacity
												style={[tp.option, selected && { backgroundColor: tint + "18" }]}
												onPress={() => {
													if (pickerMode === "start") setStartTime(item);
													else setEndTime(item);
													setPickerMode(null);
												}}
												activeOpacity={0.7}
											>
												<Text
													style={[
														tp.optionText,
														{
															color: selected ? tint : textPrimary,
															fontWeight: selected ? "700" : "400",
														},
													]}
												>
													{formatTime(item)}
												</Text>
												{selected ? (
													<IconSymbol name="checkmark" size={14} color={tint} />
												) : null}
											</TouchableOpacity>
										);
									}}
								/>
							</Pressable>
						</Pressable>
					</Modal>
				) : null}
			</Modal>
		</View>
	);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
	container: { borderRadius: 20, overflow: "hidden", paddingBottom: 4 },

	// Month header
	monthHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	monthTitle: { fontSize: 16, fontWeight: "700" },

	// Day-of-week
	dowRow: { flexDirection: "row", paddingHorizontal: 8, marginBottom: 4 },
	dowCell: { flex: 1, alignItems: "center" },
	dowText: { fontSize: 12, fontWeight: "600" },

	// Calendar grid
	calRow: { flexDirection: "row", paddingHorizontal: 8 },
	calCell: { flex: 1, alignItems: "center", paddingVertical: 3 },
	calDayCircle: {
		width: 34,
		height: 34,
		borderRadius: 17,
		justifyContent: "center",
		alignItems: "center",
	},
	calDayText: { fontSize: 14, fontWeight: "500" },
	slotDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
	slotDotPlaceholder: { width: 5, height: 5, marginTop: 2 },

	// Selected date panel
	selectedPanel: {
		borderTopWidth: 1,
		paddingHorizontal: 14,
		paddingTop: 14,
		paddingBottom: 8,
		gap: 10,
	},
	selectedHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 4,
	},
	selectedDateLabel: { fontSize: 14, fontWeight: "700", flex: 1 },
	addSlotBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 12,
		paddingVertical: 7,
		borderRadius: 14,
	},
	addSlotBtnText: { fontSize: 13, fontWeight: "700" },
	emptySlots: { fontSize: 13, textAlign: "center", paddingVertical: 16, lineHeight: 18 },

	// Slot card
	slotCard: {
		borderRadius: 14,
		padding: 12,
		borderLeftWidth: 3,
		gap: 6,
	},
	slotTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	slotTime: { fontSize: 15, fontWeight: "700" },
	slotPrice: { fontSize: 15, fontWeight: "700" },
	slotDesc: { fontSize: 13, lineHeight: 17 },
	slotFooter: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: 4,
	},

	// Owner booked info
	bookedRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
	clientAvatar: { width: 24, height: 24, borderRadius: 12, overflow: "hidden" },
	clientAvatarFallback: { justifyContent: "center", alignItems: "center" },
	clientAvatarInitial: { fontSize: 11, fontWeight: "700" },
	bookedByText: { fontSize: 13, flex: 1 },

	// Badges
	availablePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
	availableText: { fontSize: 12, fontWeight: "700" },
	bookedPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
	bookedPillText: { fontSize: 12, fontWeight: "600" },
	dangerText: { fontSize: 13, fontWeight: "600", color: "#FF453A" },

	// Client book button
	bookBtn: {
		paddingHorizontal: 20,
		paddingVertical: 9,
		borderRadius: 12,
	},
	bookBtnText: { fontSize: 14, fontWeight: "700" },
});

// Add slot modal styles
const m = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.55)",
		justifyContent: "flex-end",
	},
	sheet: {
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		maxHeight: "90%",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 12,
	},
	headerTitle: { fontSize: 18, fontWeight: "700" },
	headerBtn: { fontSize: 15, fontWeight: "500", minWidth: 52 },
	body: { paddingHorizontal: 20, paddingBottom: 40, gap: 8 },
	label: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 2, marginTop: 4 },
	readonlyRow: {
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 13,
	},
	readonlyText: { fontSize: 15 },
	pickerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 13,
	},
	pickerText: { fontSize: 15 },
	input: {
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 13,
		fontSize: 15,
	},
	textArea: { minHeight: 80, paddingTop: 13 },
});

// Time picker sub-modal styles
const tp = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.4)",
		justifyContent: "flex-end",
	},
	sheet: {
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingTop: 16,
		paddingBottom: 32,
	},
	title: {
		fontSize: 16,
		fontWeight: "700",
		textAlign: "center",
		marginBottom: 12,
		paddingHorizontal: 20,
	},
	option: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 24,
		paddingVertical: 12,
	},
	optionText: { fontSize: 16 },
});
