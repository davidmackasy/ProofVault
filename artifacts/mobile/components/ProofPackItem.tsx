import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { ProofType } from "@/types";

const PROOF_CONFIG: Record<ProofType, { label: string; icon: keyof typeof Feather.glyphMap }> = {
  receipt: { label: "Receipt", icon: "file-text" },
  online_order: { label: "Order Screenshot", icon: "monitor" },
  item_photo: { label: "Item Photo", icon: "camera" },
  serial_number: { label: "Serial Number", icon: "hash" },
  box_photo: { label: "Box / Packaging", icon: "package" },
  warranty_card: { label: "Warranty Card", icon: "shield" },
  notes: { label: "Notes", icon: "edit-3" },
};

interface Props {
  type: ProofType;
  added: boolean;
  onPress?: () => void;
}

export function ProofPackItem({ type, added, onPress }: Props) {
  const colors = useColors();
  const config = PROOF_CONFIG[type];

  return (
    <TouchableOpacity
      style={[styles.row, { borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: added ? colors.primary + "18" : colors.muted }]}>
        <Feather
          name={config.icon}
          size={18}
          color={added ? colors.primary : colors.mutedForeground}
        />
      </View>
      <Text style={[styles.label, { color: added ? colors.text : colors.mutedForeground }]}>
        {config.label}
      </Text>
      <View style={styles.right}>
        {added ? (
          <View style={[styles.checkBadge, { backgroundColor: colors.success + "22" }]}>
            <Feather name="check" size={12} color={colors.success} />
          </View>
        ) : (
          <View style={[styles.addBadge, { borderColor: colors.border }]}>
            <Feather name="plus" size={12} color={colors.mutedForeground} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  right: {
    alignItems: "center",
    justifyContent: "center",
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  addBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
