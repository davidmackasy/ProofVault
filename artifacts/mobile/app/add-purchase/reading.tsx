import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAddPurchaseFlow } from "@/context/AddPurchaseFlowContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  readReceiptFromStorage,
  uploadReceiptImage,
} from "@/lib/receiptPipeline";

const STEPS = [
  { icon: "upload-cloud" as const, label: "Scanning receipt…" },
  { icon: "file-text" as const, label: "Reading purchase details…" },
];

export default function ReadingReceiptScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const {
    capturedReceiptUri,
    setReceiptUpload,
    setExtractionResult,
    setReadStatus,
    setReadComplete,
  } = useAddPurchaseFlow();
  const [step, setStep] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0.85)).current;
  const started = useRef(false);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 16;

  useEffect(() => {
    if (!capturedReceiptUri) {
      router.replace("/add-purchase/camera" as any);
      return;
    }

    if (started.current) return;
    started.current = true;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    (async () => {
      setReadStatus("uploading");
      setStep(0);

      try {
        let storagePath: string | null = null;

        if (isSupabaseConfigured && userId && userId !== "local-user") {
          const uploaded = await uploadReceiptImage(capturedReceiptUri, userId);
          storagePath = uploaded.storagePath;
          setReceiptUpload(uploaded.storagePath, uploaded.signedUrl);
        }

        setReadStatus("reading");
        setStep(1);

        let extraction = null;
        if (storagePath) {
          extraction = await readReceiptFromStorage(storagePath);
        }

        setExtractionResult(extraction);
        setReadStatus(extraction ? "done" : "partial");
        setReadComplete(true);
        router.replace("/add-purchase/review" as any);
      } catch {
        setExtractionResult(null);
        setReadStatus("partial");
        setReadComplete(true);
        router.replace("/add-purchase/review" as any);
      } finally {
        pulse.stop();
      }
    })();

    return () => pulse.stop();
  }, [
    capturedReceiptUri,
    pulseAnim,
    setExtractionResult,
    setReadComplete,
    setReadStatus,
    setReceiptUpload,
    userId,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Scanning receipt…
        </Text>
      </View>

      <View style={styles.center}>
        <Animated.View
          style={[
            styles.ring,
            {
              borderColor: colors.primary,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </Animated.View>

        <Text style={[styles.title, { color: colors.text }]}>
          {STEPS[step]?.label ?? "Reading purchase details…"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          This usually takes a few seconds.
        </Text>

        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <View key={s.label} style={styles.stepRow}>
              <Feather
                name={i < step ? "check-circle" : s.icon}
                size={16}
                color={
                  i < step
                    ? colors.success
                    : i === step
                    ? colors.primary
                    : colors.mutedForeground
                }
              />
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color:
                      i <= step ? colors.text : colors.mutedForeground,
                  },
                ]}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  ring: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    marginTop: -8,
  },
  steps: { alignSelf: "stretch", gap: 10, marginTop: 8 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepLabel: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
