import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAddPurchaseFlow } from "@/context/AddPurchaseFlowContext";
import { useColors } from "@/hooks/useColors";

export default function ReceiptPreviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { capturedReceiptUri } = useAddPurchaseFlow();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 16;
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 24;

  useEffect(() => {
    if (!capturedReceiptUri) {
      router.replace("/add-purchase/camera" as any);
    }
  }, [capturedReceiptUri]);

  if (!capturedReceiptUri) {
    return null;
  }

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/add-purchase/camera" as any);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/add-purchase/reading" as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={handleRetake} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Preview Receipt</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={[styles.content, { paddingBottom: botPad }]}>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Make sure the receipt is clear and readable before continuing.
        </Text>

        <View
          style={[
            styles.imageCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Image
            source={{ uri: capturedReceiptUri }}
            style={styles.image}
            contentFit="contain"
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: colors.primary }]}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={[styles.continueBtnText, { color: colors.primaryForeground }]}>
              Continue
            </Text>
            <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.retakeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleRetake}
            activeOpacity={0.85}
          >
            <Feather name="rotate-ccw" size={18} color={colors.text} />
            <Text style={[styles.retakeBtnText, { color: colors.text }]}>Retake</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  content: { flex: 1, paddingHorizontal: 20, gap: 16 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  imageCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    minHeight: 280,
  },
  image: { width: "100%", height: "100%" },
  actions: { gap: 10 },
  continueBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  continueBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  retakeBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  retakeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
