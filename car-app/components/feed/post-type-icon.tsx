import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { PostType } from "./types";

type Props = {
	type: PostType;
	size: number;
	color: string;
};

export function PostTypeIcon({ type, size, color }: Props) {
	if (type === "spotted_car") return <Ionicons name="car-sport-outline" size={size} color={color} />;
	if (type === "car_meet") return <Ionicons name="people-outline" size={size} color={color} />;
	return <Ionicons name="camera-outline" size={size} color={color} />;
}
