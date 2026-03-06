import React from "react";
import { View, Text } from "react-native";
import { useAppTheme } from "@/hooks/use-app-theme";
import { styles } from "@/styles/profile";

type Props = {
	value: number;
	label: string;
};

export function StatItem({ value, label }: Props) {
	const { colors } = useAppTheme();
	return (
		<View style={styles.statItem}>
			<Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
			<Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
		</View>
	);
}
