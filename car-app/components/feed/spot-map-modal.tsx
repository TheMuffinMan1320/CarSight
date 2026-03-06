import React, { useEffect, useState, useRef } from "react";
import {
	View,
	Text,
	Modal,
	TouchableOpacity,
	ActivityIndicator,
	StyleSheet,
	Pressable,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAppTheme } from "@/hooks/use-app-theme";
import { IconSymbol } from "@/components/ui/icon-symbol";

type Props = {
	visible: boolean;
	onClose: () => void;
};

type SpotMarker = {
	id: string;
	brand: string;
	model: string;
	location: string;
	caption?: string | null;
	imageUrl: string | null;
	authorName: string;
	latitude: number;
	longitude: number;
};

const MILES_TO_KM = 1.60934;
const RADIUS_MILES = 50;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371; // Earth radius in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c; // km
}

export function SpotMapModal({ visible, onClose }: Props) {
	const { colors, tint, isDark } = useAppTheme();
	const spots = useQuery(api.posts.getWatchlistSpots);

	const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
	const [markers, setMarkers] = useState<SpotMarker[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedMarker, setSelectedMarker] = useState<SpotMarker | null>(null);
	const geocodeCache = useRef<Record<string, { lat: number; lon: number } | null>>({});

	// Get user location when modal opens
	useEffect(() => {
		if (!visible) return;
		(async () => {
			setLoading(true);
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				setLoading(false);
				return;
			}
			const pos = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			});
			setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
		})();
	}, [visible]);

	// Geocode spots once we have user location and spots data
	useEffect(() => {
		if (!visible || !userLocation || !spots) return;

		const geocodeAll = async () => {
			const results: SpotMarker[] = [];

			for (const spot of spots) {
				let coords = geocodeCache.current[spot.location];

				if (coords === undefined) {
					try {
						const geocoded = await Location.geocodeAsync(spot.location);
						if (geocoded.length > 0) {
							coords = { lat: geocoded[0].latitude, lon: geocoded[0].longitude };
						} else {
							coords = null;
						}
					} catch {
						coords = null;
					}
					geocodeCache.current[spot.location] = coords;
				}

				if (!coords) continue;

				const distKm = haversineDistance(userLocation.lat, userLocation.lon, coords.lat, coords.lon);
				if (distKm <= RADIUS_MILES * MILES_TO_KM) {
					results.push({
						id: spot._id,
						brand: spot.brand,
						model: spot.model,
						location: spot.location,
						caption: spot.caption,
						imageUrl: spot.imageUrl,
						authorName: spot.authorName,
						latitude: coords.lat,
						longitude: coords.lon,
					});
				}
			}

			setMarkers(results);
			setLoading(false);
		};

		geocodeAll();
	}, [visible, userLocation, spots]);

	const initialRegion: Region | undefined = userLocation
		? {
				latitude: userLocation.lat,
				longitude: userLocation.lon,
				latitudeDelta: 1.0,
				longitudeDelta: 1.0,
		  }
		: undefined;

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="fullScreen"
			onRequestClose={onClose}
		>
			<View style={styles.container}>
				{/* Header */}
				<View style={[styles.header, { backgroundColor: colors.surface }]}>
					<TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
						<IconSymbol name="chevron.down" size={20} color={colors.textPrimary} />
					</TouchableOpacity>
					<Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Nearby Spots</Text>
					<View style={{ width: 44 }} />
				</View>

				{loading ? (
					<View style={styles.centered}>
						<ActivityIndicator size="large" color={tint} />
						<Text style={[styles.loadingText, { color: colors.textSecondary }]}>
							Finding nearby spots...
						</Text>
					</View>
				) : !userLocation ? (
					<View style={styles.centered}>
						<Text style={[styles.emptyText, { color: colors.textSecondary }]}>
							Location permission required to show map
						</Text>
					</View>
				) : (
					<MapView
						style={styles.map}
						initialRegion={initialRegion}
						userInterfaceStyle={isDark ? "dark" : "light"}
						showsUserLocation
						showsMyLocationButton
					>
						{markers.map((marker) => (
							<Marker
								key={marker.id}
								coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
								onPress={() => setSelectedMarker(marker)}
								pinColor={tint}
							/>
						))}
					</MapView>
				)}

				{/* Marker callout */}
				{selectedMarker && (
					<View style={[styles.callout, { backgroundColor: colors.surface }]}>
						<Pressable style={styles.calloutDismiss} onPress={() => setSelectedMarker(null)} />
						<View style={styles.calloutContent}>
							<Text style={[styles.calloutTitle, { color: colors.textPrimary }]}>
								{selectedMarker.brand} {selectedMarker.model}
							</Text>
							<Text style={[styles.calloutLocation, { color: colors.textSecondary }]}>
								{selectedMarker.location}
							</Text>
							{selectedMarker.caption ? (
								<Text style={[styles.calloutCaption, { color: colors.textSecondary }]} numberOfLines={2}>
									{selectedMarker.caption}
								</Text>
							) : null}
							<Text style={[styles.calloutAuthor, { color: tint }]}>
								by {selectedMarker.authorName}
							</Text>
						</View>
					</View>
				)}

				{!loading && userLocation && markers.length === 0 && (
					<View style={[styles.emptyBanner, { backgroundColor: colors.surface }]}>
						<Text style={[styles.emptyText, { color: colors.textSecondary }]}>
							No watchlist cars spotted within {RADIUS_MILES} miles
						</Text>
					</View>
				)}
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingTop: 56,
		paddingBottom: 12,
		paddingHorizontal: 16,
	},
	closeBtn: {
		width: 44,
		height: 44,
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: {
		fontSize: 17,
		fontWeight: "600",
	},
	map: {
		flex: 1,
	},
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
		paddingHorizontal: 32,
	},
	loadingText: {
		fontSize: 14,
		textAlign: "center",
	},
	emptyText: {
		fontSize: 14,
		textAlign: "center",
	},
	callout: {
		position: "absolute",
		bottom: 32,
		left: 16,
		right: 16,
		borderRadius: 16,
		padding: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
	},
	calloutDismiss: {
		position: "absolute",
		top: 0,
		right: 0,
		width: 44,
		height: 44,
	},
	calloutContent: {
		gap: 4,
	},
	calloutTitle: {
		fontSize: 17,
		fontWeight: "700",
	},
	calloutLocation: {
		fontSize: 13,
	},
	calloutCaption: {
		fontSize: 13,
		marginTop: 2,
	},
	calloutAuthor: {
		fontSize: 12,
		fontWeight: "600",
		marginTop: 4,
	},
	emptyBanner: {
		position: "absolute",
		bottom: 32,
		left: 16,
		right: 16,
		borderRadius: 12,
		padding: 14,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
});
