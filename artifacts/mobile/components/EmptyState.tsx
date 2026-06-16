import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon = "inbox", title, description, ctaLabel, onCta }: Props) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={[styles.iconBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name={icon} size={28} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.desc, { color: colors.mutedForeground }]}>{description}</Text>
      ) : null}
      {ctaLabel && onCta ? (
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.primary }]}
          onPress={onCta}
          activeOpacity={0.8}
        >
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>{ctaLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 12,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 4,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    textAlign: "center",
  },
  desc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  cta: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
