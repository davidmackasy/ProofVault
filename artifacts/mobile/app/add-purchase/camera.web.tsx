import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function CameraCaptureScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + 67 + 16;
  const botPad = insets.bottom + 34 + 24;

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleUpload = useCallback(() => {
    router.push("/add-purchase/scan");
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
          <Feather name="x" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Scan Receipt
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={[styles.content, { paddingBottom: botPad }]}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: colors.primary + "14",
              borderColor: colors.primary + "30",
            },
          ]}
        >
          <Feather name="camera" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          Camera capture is available on device
        </Text>
        <Text style={[styles.message, { color: colors.mutedForeground }]}>
          In-app receipt scanning requires a physical iOS or Android device.
          Use Upload Screenshot on web to add proof from your library.
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={handleUpload}
          activeOpacity={0.85}
        >
          <Feather name="upload" size={18} color={colors.primaryForeground} />
          <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
            Upload Photo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleBack} style={styles.backLink}>
          <Text style={[styles.backLinkText, { color: colors.mutedForeground }]}>
            Go back
          </Text>
        </TouchableOpacity>
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
    paddingBottom: 16,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 8,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.4,
    textAlign: "center",
  },
  message: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 320,
  },
  primaryBtn: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  primaryBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  backLink: { paddingVertical: 8 },
  backLinkText: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
