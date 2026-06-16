import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import {
  daysFromNow,
  formatCurrency,
  formatDate,
  usePurchases,
} from "@/context/PurchaseContext";
import { useColors } from "@/hooks/useColors";
import { PurchaseItem } from "@/types";

type TabKey = "returns" | "warranties" | "all";

function groupByUrgency(items: PurchaseItem[], deadlineFn: (i: PurchaseItem) => string | undefined) {
  const thisWeek: PurchaseItem[] = [];
  const thisMonth: PurchaseItem[] = [];
  const later: PurchaseItem[] = [];

  for (const item of items) {
    const days = daysFromNow(deadlineFn(item));
    if (days === null || days <= 0) continue;
    if (days <= 7) thisWeek.push(item);
    else if (days <= 30) thisMonth.push(item);
    else later.push(item);
  }

  return { thisWeek, thisMonth, later };
}

function DeadlineRow({ item, deadlineDate }: { item: PurchaseItem; deadlineDate: string | undefined }) {
  const colors = useColors();
  const days = daysFromNow(deadlineDate);
  if (!days || days <= 0) return null;

  const urgentColor = days <= 7 ? colors.danger : days <= 14 ? colors.warning : colors.mutedForeground;

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/item/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
        <Feather name="package" size={20} color={colors.mutedForeground} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
          {item.itemName}
        </Text>
        <Text style={[styles.rowStore, { color: colors.mutedForeground }]}>
          {item.storeName ?? "Unknown"} · {formatDate(deadlineDate)}
        </Text>
        <View style={styles.rowMeta}>
          <StatusBadge status={item.status} size="sm" />
          {item.totalAmount !== undefined && (
            <Text style={[styles.rowPrice, { color: colors.mutedForeground }]}>
              {formatCurrency(item.totalAmount, item.currency)}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.daysBox}>
        <Text style={[styles.daysNum, { color: urgentColor }]}>{days}</Text>
        <Text style={[styles.daysLabel, { color: colors.mutedForeground }]}>days</Text>
      </View>
    </TouchableOpacity>
  );
}

function SectionGroup({ title, items, deadlineFn }: {
  title: string;
  items: PurchaseItem[];
  deadlineFn: (i: PurchaseItem) => string | undefined;
}) {
  const colors = useColors();
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      {items.map((item) => (
        <DeadlineRow key={item.id} item={item} deadlineDate={deadlineFn(item)} />
      ))}
    </View>
  );
}

export default function ReturnsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { items } = usePurchases();
  const [activeTab, setActiveTab] = useState<TabKey>("returns");

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 16;
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90;

  const returnable = useMemo(
    () => items.filter((i) => (i.status === "returnable" || i.status === "ending_soon") && i.returnDeadline),
    [items]
  );
  const warranties = useMemo(
    () => items.filter((i) => (i.status === "under_warranty" || i.status === "ending_soon") && i.warrantyExpiry),
    [items]
  );
  const allDeadlines = useMemo(
    () => items.filter((i) => i.returnDeadline || i.warrantyExpiry),
    [items]
  );

  const displayItems = activeTab === "returns" ? returnable : activeTab === "warranties" ? warranties : allDeadlines;
  const deadlineFn =
    activeTab === "warranties"
      ? (i: PurchaseItem) => i.warrantyExpiry
      : (i: PurchaseItem) => i.returnDeadline ?? i.warrantyExpiry;

  const grouped = groupByUrgency(displayItems, deadlineFn);

  const TABS: { key: TabKey; label: string }[] = [
    { key: "returns", label: "Returnable" },
    { key: "warranties", label: "Warranties" },
    { key: "all", label: "All Deadlines" },
  ];

  const isEmpty = grouped.thisWeek.length === 0 && grouped.thisMonth.length === 0 && grouped.later.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Returns</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Can I still return this?
          </Text>
        </View>
      </View>

      <View style={[styles.tabBar, { borderColor: colors.border }]}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[
              styles.tab,
              activeTab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === t.key ? colors.primary : colors.mutedForeground },
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <EmptyState
            icon="check-circle"
            title="You're all caught up"
            description="Nothing to return right now — we'll let you know before any window closes."
          />
        ) : (
          <>
            <SectionGroup title="THIS WEEK" items={grouped.thisWeek} deadlineFn={deadlineFn} />
            <SectionGroup title="THIS MONTH" items={grouped.thisMonth} deadlineFn={deadlineFn} />
            <SectionGroup title="LATER" items={grouped.later} deadlineFn={deadlineFn} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.6 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 2 },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, gap: 0 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowContent: { flex: 1, gap: 4 },
  rowName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  rowStore: { fontFamily: "Inter_400Regular", fontSize: 12 },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowPrice: { fontFamily: "Inter_500Medium", fontSize: 12 },
  daysBox: { alignItems: "center", flexShrink: 0 },
  daysNum: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.5 },
  daysLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
});
