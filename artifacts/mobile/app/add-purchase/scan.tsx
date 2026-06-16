import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 16;
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 24;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedUri(result.assets[0].uri);
    }
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/add-purchase/scanning", params: { uri: selectedUri ?? "" } });
  };

  const OPTIONS = [
    { icon: "camera" as const, label: "Scan Receipt", onPress: pickImage },
    { icon: "image" as const, label: "Upload Screenshot", onPress: pickImage },
    { icon: "file" as const, label: "Import Email", onPress: pickImage },
    { icon: "smartphone" as const, label: "Take Item Photo", onPress: pickImage },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Upload Receipt</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={[styles.content, { paddingBottom: botPad }]}>
        <View style={styles.prompt}>
          <View style={[styles.promptIcon, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "30" }]}>
            <Feather name="upload" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.promptTitle, { color: colors.text }]}>
            Build your Proof Pack
          </Text>
          <Text style={[styles.promptSub, { color: colors.mutedForeground }]}>
            Upload a receipt, order screenshot, or proof of purchase.
          </Text>
        </View>

        <View style={styles.grid}>
          {OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={opt.onPress}
              activeOpacity={0.75}
            >
              <View style={[styles.gridIcon, { backgroundColor: colors.muted }]}>
                <Feather name={opt.icon} size={24} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.gridLabel, { color: colors.text }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedUri && (
          <View style={[styles.selectedBadge, { backgroundColor: colors.success + "18", borderColor: colors.success + "30" }]}>
            <Feather name="check-circle" size={16} color={colors.success} />
            <Text style={[styles.selectedText, { color: colors.success }]}>
              File selected — ready to analyze
            </Text>
          </View>
        )}

        <View style={styles.bottom}>
          <TouchableOpacity
            style={[
              styles.continueBtn,
              { backgroundColor: selectedUri ? colors.primary : colors.card, borderColor: colors.border, borderWidth: selectedUri ? 0 : 1 },
            ]}
            onPress={selectedUri ? handleContinue : undefined}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.continueBtnText,
                { color: selectedUri ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              {selectedUri ? "Analyze with AI" : "Select a file first"}
            </Text>
            {selectedUri && <Feather name="zap" size={16} color={colors.primaryForeground} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/add-purchase/manual")}>
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
              Skip — add manually
            </Text>
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
    paddingBottom: 20,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  content: { flex: 1, paddingHorizontal: 20, justifyContent: "space-between" },
  prompt: { alignItems: "center", gap: 12 },
  promptIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  promptTitle: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.4 },
  promptSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridItem: {
    width: "47%",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  gridIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  gridLabel: { fontFamily: "Inter_500Medium", fontSize: 13, textAlign: "center" },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectedText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  bottom: { gap: 12, alignItems: "center" },
  continueBtn: {
    width: "100%",
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  continueBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  skipText: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
