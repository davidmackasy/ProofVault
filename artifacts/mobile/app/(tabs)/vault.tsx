import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PurchaseCard } from "@/components/PurchaseCard";
import { EmptyState } from "@/components/EmptyState";
import { usePurchases } from "@/context/PurchaseContext";
import { useColors } from "@/hooks/useColors";
import { PurchaseStatus } from "@/types";
import { router } from "expo-router";

type FilterKey = "all" | PurchaseStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "returnable", label: "Returnable" },
  { key: "ending_soon", label: "Ending Soon" },
  { key: "under_warranty", label: "Warranty" },
  { key: "needs_proof", label: "Needs Proof" },
  { key: "expired", label: "Expired" },
];

export default function VaultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { items } = usePurchases();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    let result = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.itemName.toLowerCase().includes(q) ||
          (i.storeName ?? "").toLowerCase().includes(q) ||
          (i.category ?? "").toLowerCase().includes(q)
      );
    }
    if (activeFilter !== "all") {
      result = result.filter((i) => i.status === activeFilter);
    }
    return result;
  }, [items, search, activeFilter]);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 16;
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Text style={[styles.title, { color: colors.text }]}>Vault</Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {items.length} {items.length === 1 ? "item" : "items"}
        </Text>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={17} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search purchases, stores..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeFilter === f.key ? colors.primary : colors.card,
                borderColor: activeFilter === f.key ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text
              style={[
                styles.filterLabel,
                {
                  color: activeFilter === f.key ? colors.primaryForeground : colors.mutedForeground,
                },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: botPad }]}
        renderItem={({ item }) => <PurchaseCard item={item} />}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          <EmptyState
            icon="package"
            title={search ? "No results found" : "Your vault is empty"}
            description={
              search
                ? "Try a different search term."
                : "Add your first purchase and we'll help protect it."
            }
            ctaLabel={search ? undefined : "Add your first purchase"}
            onCta={search ? undefined : () => router.push("/add-purchase")}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.6 },
  count: { fontFamily: "Inter_400Regular", fontSize: 14 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  filtersRow: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  list: { paddingHorizontal: 20, paddingTop: 4 },
});
