import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import * as SecureStore from "expo-secure-store";
import { Platform, View, ActivityIndicator } from "react-native";
import { useEffect } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

const secureStorage =
	Platform.OS !== "web"
		? {
				getItem: SecureStore.getItemAsync,
				setItem: SecureStore.setItemAsync,
				removeItem: SecureStore.deleteItemAsync,
		  }
		: undefined;

export const unstable_settings = {
	anchor: "(tabs)",
};

function RootLayoutNav() {
	const { isLoading, isAuthenticated } = useConvexAuth();
	const segments = useSegments();
	const router = useRouter();

	useEffect(() => {
		if (isLoading) return;
		const inAuth = segments[0] === "(auth)";
		if (!isAuthenticated && !inAuth) {
			router.replace("/(auth)");
		} else if (isAuthenticated && inAuth) {
			router.replace("/(tabs)");
		}
	}, [isLoading, isAuthenticated, segments]);

	if (isLoading) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return <Slot />;
}

export default function RootLayout() {
	const colorScheme = useColorScheme();

	return (
		<ConvexAuthProvider client={convex} storage={secureStorage}>
			<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
				<RootLayoutNav />
				<StatusBar style="auto" />
			</ThemeProvider>
		</ConvexAuthProvider>
	);
}
