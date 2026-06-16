import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { PurchaseStatus } from "@/types";

const STATUS_CONFIG: Record<
  PurchaseStatus,
  { label: string; colorKey: string }
> = {
  returnable: { label: "Returnable", colorKey: "primary" },
  ending_soon: { label: "Ending Soon", colorKey: "warning" },
  under_warranty: { label: "Under Warranty", colorKey: "accent" },
  needs_proof: { label: "Needs Proof", colorKey: "danger" },
  expired: { label: "Expired", colorKey: "mutedForeground" },
  archived: { label: "Archived", colorKey: "mutedForeground" },
  fully_protected: { label: "Fully Protected", colorKey: "success" },
};

interface Props {
  status: PurchaseStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: Props) {
  const colors = useColors();
  const config = STATUS_CONFIG[status];
  const color = (colors as Record<string, string>)[config.colorKey] ?? colors.mutedForeground;

  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + "22",
          borderColor: color + "44",
          paddingHorizontal: isSmall ? 6 : 8,
          paddingVertical: isSmall ? 2 : 4,
        },
      ]}
    >
      <View
        style={[styles.dot, { backgroundColor: color, width: isSmall ? 5 : 6, height: isSmall ? 5 : 6 }]}
      />
      <Text
        style={[
          styles.label,
          { color, fontSize: isSmall ? 10 : 11 },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  dot: {
    borderRadius: 3,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
});
