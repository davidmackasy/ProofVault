import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CameraPermissionScreen } from "@/components/CameraPermissionScreen";
import { useAddPurchaseFlow } from "@/context/AddPurchaseFlowContext";
import { useColors } from "@/hooks/useColors";

export default function CameraCaptureScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { setCapturedReceiptUri } = useAddPurchaseFlow();
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const topPad = insets.top + 12;
  const botPad = insets.bottom + 24;

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || !isReady || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });
      if (photo?.uri) {
        setCapturedReceiptUri(photo.uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push("/add-purchase/preview" as any);
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsCapturing(false);
    }
  }, [isReady, isCapturing, setCapturedReceiptUri]);

  if (!permission) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <CameraPermissionScreen
        title="Camera access needed"
        message="ProofVault needs camera access to scan your receipt in-app. Your photos stay on your device until you choose to save them."
        onRetry={requestPermission}
        onBack={handleBack}
      />
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setIsReady(true)}
      />

      <View
        style={[
          styles.overlay,
          { paddingTop: topPad, paddingBottom: botPad },
        ]}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBack} style={styles.topBtn}>
            <Feather name="x" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scan Receipt</Text>
          <View style={styles.topBtn} />
        </View>

        <View style={styles.frameArea}>
          <View style={styles.frame}>
            <View
              style={[styles.corner, styles.cornerTL, { borderColor: colors.primary }]}
            />
            <View
              style={[styles.corner, styles.cornerTR, { borderColor: colors.primary }]}
            />
            <View
              style={[styles.corner, styles.cornerBL, { borderColor: colors.primary }]}
            />
            <View
              style={[styles.corner, styles.cornerBR, { borderColor: colors.primary }]}
            />
          </View>
          <Text style={styles.hint}>Align your receipt inside the frame</Text>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.captureBtn,
              {
                borderColor: colors.primary,
                opacity: isReady && !isCapturing ? 1 : 0.5,
              },
            ]}
            onPress={handleCapture}
            disabled={!isReady || isCapturing}
            activeOpacity={0.85}
          >
            <View
              style={[styles.captureInner, { backgroundColor: colors.primary }]}
            >
              {isCapturing ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Feather name="camera" size={28} color={colors.primaryForeground} />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00000066",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  frameArea: { alignItems: "center", gap: 16, paddingHorizontal: 32 },
  frame: {
    width: "100%",
    aspectRatio: 0.72,
    maxHeight: 420,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#FFFFFFCC",
    textAlign: "center",
  },
  bottomBar: { alignItems: "center" },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00000044",
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
});
