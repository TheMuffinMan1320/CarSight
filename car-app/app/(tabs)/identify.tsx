import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Fonts } from "@/constants/theme";
import { useTensorflowModel } from "react-native-fast-tflite";
import * as ImageManipulator from "expo-image-manipulator";
import jpeg from "jpeg-js";

const { width: SCREEN_W } = Dimensions.get("window");

const carLabels: string[] = require("../../assets/car_labels.json");

type Phase = "camera" | "capturing" | "analyzing" | "results" | "error" | "permission_denied";

interface IdentifyResult {
  brand: string;
  model: string;
  confidence: number;
}

function parseLabel(label: string): { brand: string; model: string } {
  const parts = label.split(" ");
  return { brand: parts[0], model: parts.slice(1).join(" ") };
}

async function imageUriToTensor(uri: string): Promise<Float32Array> {
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 224, height: 224 } }],
    { base64: true, format: ImageManipulator.SaveFormat.JPEG, compress: 1.0 }
  );

  const base64 = resized.base64!;
  const binaryStr = atob(base64);
  const jpegBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    jpegBytes[i] = binaryStr.charCodeAt(i);
  }

  const { data: rgba } = jpeg.decode(jpegBytes.buffer as ArrayBuffer, { useTArray: true });

  const floats = new Float32Array(224 * 224 * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    floats[j]     = rgba[i]     / 255.0;
    floats[j + 1] = rgba[i + 1] / 255.0;
    floats[j + 2] = rgba[i + 2] / 255.0;
  }
  return floats;
}

export default function IdentifyScreen() {
  const { colors, tint } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>("camera");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const cameraRef = useRef<CameraView>(null);

  const tfModel = useTensorflowModel(
    require("../../assets/stanford_cars_classifier.tflite")
  );

  useFocusEffect(
    useCallback(() => {
      setPhase("camera");
      setPhotoUri(null);
      setResult(null);
    }, [])
  );

  async function handleCapture() {
    if (!cameraRef.current || phase !== "camera") return;
    if (tfModel.state !== "loaded" || !tfModel.model) {
      setPhase("error");
      return;
    }
    setPhase("capturing");
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (!photo) throw new Error("No photo");
      setPhotoUri(photo.uri);
      setPhase("analyzing");

      const inputTensor = await imageUriToTensor(photo.uri);
      const outputs = tfModel.model.runSync([inputTensor]);
      const scores = outputs[0] as Float32Array;

      let topIdx = 0;
      let topScore = -Infinity;
      for (let i = 0; i < scores.length; i++) {
        if (scores[i] > topScore) {
          topScore = scores[i];
          topIdx = i;
        }
      }

      const { brand, model } = parseLabel(carLabels[topIdx]);
      setResult({ brand, model, confidence: topScore });
      setPhase("results");
    } catch (e) {
      console.error("Identify error:", e);
      setPhase("error");
    }
  }

  function handleRetry() {
    setPhase("camera");
    setPhotoUri(null);
    setResult(null);
  }

  // ── Permission states ──────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.pageBg }]}>
        <ActivityIndicator color={tint} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.pageBg }]}>
        <View style={styles.centered}>
          <Ionicons name="camera-outline" size={64} color={colors.textPlaceholder} />
          <Text style={[styles.permTitle, { color: colors.textPrimary, fontFamily: Fonts?.rounded }]}>
            Camera Access Needed
          </Text>
          <Text style={[styles.permSubtitle, { color: colors.textSecondary }]}>
            CarSight uses your camera to identify cars with AI.
          </Text>
          <TouchableOpacity
            style={[styles.permBtn, { backgroundColor: tint }]}
            onPress={requestPermission}
          >
            <Text style={[styles.permBtnText, { color: colors.iconOnTint }]}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Analyzing state ────────────────────────────────────────────────────────
  if (phase === "analyzing" && photoUri) {
    return (
      <View style={styles.flex}>
        <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
        <View style={styles.analyzeOverlay}>
          <View style={[styles.analyzeCard, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={tint} />
            <Text style={[styles.analyzeTitle, { color: colors.textPrimary, fontFamily: Fonts?.rounded }]}>
              Analysing…
            </Text>
            <Text style={[styles.analyzeSubtitle, { color: colors.textSecondary }]}>
              AI is identifying the car
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ── Results state ──────────────────────────────────────────────────────────
  if (phase === "results" && photoUri && result) {
    return (
      <View style={styles.flex}>
        <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
        <View style={styles.resultsOverlay}>
          <View style={[styles.resultsCard, { backgroundColor: colors.surface }]}>
            <View style={styles.resultsHeader}>
              <View style={[styles.resultsBadge, { backgroundColor: tint + "22" }]}>
                <Ionicons name="car-sport-outline" size={18} color={tint} />
                <Text style={[styles.resultsBadgeText, { color: tint }]}>Identified</Text>
              </View>
              {result.confidence > 0 && (
                <Text style={[styles.confidenceText, { color: colors.textSecondary }]}>
                  {Math.round(result.confidence * 100)}% confidence
                </Text>
              )}
            </View>

            <Text style={[styles.resultBrand, { color: colors.textPrimary, fontFamily: Fonts?.rounded }]}>
              {result.brand}
            </Text>
            <Text style={[styles.resultModel, { color: colors.textSecondary }]}>
              {result.model}
            </Text>

            <TouchableOpacity
              style={[styles.retryBtn, { borderColor: tint }]}
              onPress={handleRetry}
            >
              <Ionicons name="camera-outline" size={18} color={tint} />
              <Text style={[styles.retryBtnText, { color: tint }]}>Scan Another</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: colors.pageBg }]}>
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={56} color={colors.textPlaceholder} />
          <Text style={[styles.permTitle, { color: colors.textPrimary }]}>Something went wrong</Text>
          <TouchableOpacity style={[styles.permBtn, { backgroundColor: tint }]} onPress={handleRetry}>
            <Text style={[styles.permBtnText, { color: colors.iconOnTint }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Camera view ────────────────────────────────────────────────────────────
  const modelLoading = tfModel.state === "loading";

  return (
    <View style={styles.flex}>
      <CameraView ref={cameraRef} style={styles.flex} facing={facing}>
        <SafeAreaView style={styles.topBar} edges={["top"]}>
          <Text style={[styles.topTitle, { fontFamily: Fonts?.rounded }]}>Identify</Text>
          <TouchableOpacity
            style={styles.flipBtn}
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          >
            <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>

        <View style={styles.viewfinderWrap} pointerEvents="none">
          <View style={styles.viewfinderFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.viewfinderHint}>
            {modelLoading ? "Loading AI model…" : "Centre the car in frame"}
          </Text>
        </View>

        <View style={styles.shutterArea}>
          <TouchableOpacity
            style={[styles.shutterBtn, (phase === "capturing" || modelLoading) && styles.shutterBtnDisabled]}
            onPress={handleCapture}
            activeOpacity={0.8}
            disabled={phase === "capturing" || modelLoading}
          >
            {phase === "capturing" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;
const FRAME_W = SCREEN_W * 0.78;
const FRAME_H = FRAME_W * 0.6;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },

  permTitle: { fontSize: 20, fontWeight: "700", textAlign: "center", marginTop: 8 },
  permSubtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  permBtn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  permBtnText: { fontSize: 16, fontWeight: "600" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  topTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  flipBtn: { position: "absolute", right: 20, padding: 6 },

  viewfinderWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  viewfinderFrame: { width: FRAME_W, height: FRAME_H, position: "relative" },
  corner: { position: "absolute", width: CORNER_SIZE, height: CORNER_SIZE, borderColor: "#fff" },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 4 },
  viewfinderHint: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  shutterArea: {
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 48 : 32,
    paddingTop: 20,
  },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnDisabled: { opacity: 0.5 },
  shutterInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#fff" },

  photoPreview: { ...StyleSheet.absoluteFillObject },

  analyzeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  analyzeCard: { width: "100%", borderRadius: 20, padding: 32, alignItems: "center", gap: 12 },
  analyzeTitle: { fontSize: 22, fontWeight: "700" },
  analyzeSubtitle: { fontSize: 15 },

  resultsOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  resultsCard: {
    borderRadius: 20,
    padding: 24,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  resultsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  resultsBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  resultsBadgeText: { fontSize: 13, fontWeight: "600" },
  confidenceText: { fontSize: 13 },
  resultBrand: { fontSize: 30, fontWeight: "800", lineHeight: 36 },
  resultModel: { fontSize: 18, fontWeight: "500" },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  retryBtnText: { fontSize: 15, fontWeight: "600" },
});
