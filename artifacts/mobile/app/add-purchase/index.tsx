import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type Option = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  route: string;
  primary?: boolean;
};

const OPTIONS: Option[] = [
  {
    icon: "camera",
    title: "Scan Receipt",
    description: "Point your camera at a paper receipt",
    route: "/add-purchase/camera",
    primary: true,
  },
  {
    icon: "image",
    title: "Upload Screenshot",
    description: "Select an order screenshot or PDF",
    route: "/add-purchase/scan",
  },
  {
    icon: "package",
    title: "Take Item Photo",
    description: "Photograph the item or its box",
    route: "/add-purchase/scan",
  },
  {
    icon: "edit-3",
    title: "Add Manually",
    description: "Enter purchase details yourself",
    route: "/add-purchase/manual",
  },
];

export default function AddPurchaseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 16;
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 24;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Add Purchase</Text>
        <View style={styles.closeBtn} />
      </View>

      <View style={[styles.content, { paddingBottom: botPad }]}>
        <View style={styles.intro}>
          <Text style={[styles.introTitle, { color: colors.text }]}>
            Add proof now.
          </Text>
          <Text style={[styles.introSub, { color: colors.mutedForeground }]}>
            You can complete details later.
          </Text>
        </View>

        <View style={styles.options}>
          {OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.title}
              style={[
                styles.option,
                {
                  backgroundColor: option.primary ? colors.primary + "14" : colors.card,
                  borderColor: option.primary ? colors.primary + "40" : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push(option.route as any);
              }}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor: option.primary ? colors.primary : colors.muted,
                  },
                ]}
              >
                <Feather
                  name={option.icon}
                  size={22}
                  color={option.primary ? colors.primaryForeground : colors.mutedForeground}
                />
              </View>
              <View style={styles.optionText}>
                <Text
                  style={[
                    styles.optionTitle,
                    { color: option.primary ? colors.primary : colors.text },
                  ]}
                >
                  {option.title}
                </Text>
                <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                  {option.description}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.border} />
            </TouchableOpacity>
          ))}
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
    paddingBottom: 24,
  },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  content: { flex: 1, paddingHorizontal: 20, gap: 28 },
  intro: { gap: 4 },
  introTitle: { fontFamily: "Inter_700Bold", fontSize: 26, letterSpacing: -0.5 },
  introSub: { fontFamily: "Inter_400Regular", fontSize: 15 },
  options: { gap: 10 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { flex: 1, gap: 3 },
  optionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  optionDesc: { fontFamily: "Inter_400Regular", fontSize: 13 },
});
