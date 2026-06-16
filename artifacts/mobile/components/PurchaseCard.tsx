import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { daysFromNow, formatCurrency } from "@/context/PurchaseContext";
import { PurchaseItem } from "@/types";
import { StatusBadge } from "./StatusBadge";

interface Props {
  item: PurchaseItem;
}

export function PurchaseCard({ item }: Props) {
  const colors = useColors();
  const returnDays = daysFromNow(item.returnDeadline);
  const hasReturn = returnDays !== null && returnDays > 0;

  const deadline = hasReturn
    ? { days: returnDays!, label: "return left" }
    : item.warrantyExpiry
    ? { days: daysFromNow(item.warrantyExpiry) ?? 0, label: "warranty left" }
    : null;

  const deadlineColor =
    deadline && deadline.days <= 7
      ? colors.danger
      : deadline && deadline.days <= 30
      ? colors.warning
      : colors.mutedForeground;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/item/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.muted }]}>
        <Feather name="package" size={22} color={colors.mutedForeground} />
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {item.itemName}
          </Text>
          {item.totalAmount !== undefined && (
            <Text style={[styles.price, { color: colors.text }]}>
              {formatCurrency(item.totalAmount, item.currency)}
            </Text>
          )}
        </View>
        <Text style={[styles.store, { color: colors.mutedForeground }]}>
          {item.storeName ?? "Unknown store"}
        </Text>
        <View style={styles.footer}>
          <StatusBadge status={item.status} size="sm" />
          {deadline && deadline.days > 0 && (
            <Text style={[styles.days, { color: deadlineColor }]}>
              {deadline.days}d {deadline.label}
            </Text>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={colors.border} style={styles.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    flex: 1,
  },
  price: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    flexShrink: 0,
  },
  store: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  days: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  chevron: {
    flexShrink: 0,
  },
});
