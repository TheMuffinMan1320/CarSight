import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { useAppTheme } from "@/hooks/use-app-theme";
import { styles } from "@/styles/profile";

const CHART_BAR_HEIGHT = 110;

function getMonthBuckets() {
	const now = new Date();
	return Array.from({ length: 6 }, (_, i) => {
		const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
		return {
			key: `${d.getFullYear()}-${d.getMonth()}`,
			label: d.toLocaleString("default", { month: "short" }),
			count: 0,
		};
	});
}

type Props = {
	cars: { _creationTime: number }[];
};

export function SpotsChart({ cars }: Props) {
	const { colors, tint } = useAppTheme();

	const months = useMemo(() => {
		const buckets = getMonthBuckets();
		for (const car of cars) {
			const date = new Date(car._creationTime);
			const key = `${date.getFullYear()}-${date.getMonth()}`;
			const bucket = buckets.find((b) => b.key === key);
			if (bucket) bucket.count++;
		}
		return buckets;
	}, [cars]);

	const maxCount = Math.max(...months.map((m) => m.count), 1);

	return (
		<View style={styles.chartWrap}>
			{months.map((m) => {
				const barH = m.count > 0
					? Math.max((m.count / maxCount) * CHART_BAR_HEIGHT, 8)
					: 0;
				return (
					<View key={m.key} style={styles.barCol}>
						{m.count > 0 && (
							<Text style={[styles.barValue, { color: colors.textSecondary }]}>
								{m.count}
							</Text>
						)}
						<View style={[styles.barTrack, { backgroundColor: colors.subtleBg }]}>
							<View style={[styles.barFill, { height: barH, backgroundColor: tint }]} />
						</View>
						<Text style={[styles.barMonth, { color: colors.textSecondary }]}>
							{m.label}
						</Text>
					</View>
				);
			})}
		</View>
	);
}
