import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PurchaseCard } from "@/components/PurchaseCard";
import { useAuth } from "@/context/AuthContext";
import {
  daysFromNow,
  formatCurrency,
  usePurchases,
} from "@/context/PurchaseContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userName } = useAuth();
  const {
    items,
    returnableItems,
    endingSoonItems,
    needsProofItems,
    totalProtectedValue,
  } = usePurchases();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 12;
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90;

  const activeItems = items.filter(
    (i) => i.status !== "archived" && i.status !== "expired"
  );
  const recentItems = items.slice(0, 4);

  const warrantyEndingSoon = items.filter(
    (i) =>
      i.warrantyExpiry &&
      (() => {
        const d = daysFromNow(i.warrantyExpiry);
        return d !== null && d > 0 && d <= 30;
      })()
  );

  const attentionItems = [
    {
      key: "returns",
      icon: "rotate-ccw" as const,
      count: endingSoonItems.length,
      label: "return ending soon",
      color: colors.danger,
      onPress: () => router.push("/(tabs)/returns"),
    },
    {
      key: "warranty",
      icon: "shield" as const,
      count: warrantyEndingSoon.length,
      label: "warranty ending",
      color: colors.warning,
      onPress: () => router.push("/(tabs)/returns"),
    },
    {
      key: "proof",
      icon: "alert-circle" as const,
      count: needsProofItems.length,
      label: "needs proof",
      color: colors.accent,
      onPress: () => router.push("/(tabs)/vault"),
    },
  ].filter((a) => a.count > 0);

  const isEmpty = items.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad }]}>
        <View>
          <Text style={[styles.logo, { color: colors.primary }]}>ProofVault</Text>
          {userName ? (
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              Hey, {userName.split(" ")[0]}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity style={[styles.bellBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="bell" size={19} color={colors.text} />
          {(endingSoonItems.length + needsProofItems.length) > 0 && (
            <View style={[styles.bellDot, { backgroundColor: colors.danger }]} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View style={styles.emptyHero}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "30" }]}>
              <Feather name="shield" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Your vault is empty.
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Add your first purchase and we'll help protect it.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/add-purchase");
              }}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={18} color={colors.primaryForeground} />
              <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>
                Add your first purchase
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.heroRow}>
                <View style={styles.heroLeft}>
                  <Text style={[styles.heroAmount, { color: colors.text }]}>
                    {formatCurrency(totalProtectedValue)}
                  </Text>
                  <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>
                    protected
                  </Text>
                </View>
                <View style={[styles.heroBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" }]}>
                  <Feather name="shield" size={18} color={colors.primary} />
                  <Text style={[styles.heroBadgeText, { color: colors.primary }]}>
                    {activeItems.length} items
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.ctaCard, { backgroundColor: "#0A1628", borderColor: colors.primary + "50" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/returns");
              }}
              activeOpacity={0.8}
            >
              <View style={styles.ctaLeft}>
                <View style={[styles.ctaIconBox, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name="rotate-ccw" size={22} color={colors.primary} />
                </View>
                <View style={styles.ctaText}>
                  <Text style={[styles.ctaTitle, { color: colors.primary }]}>
                    Can I still return this?
                  </Text>
                  <Text style={[styles.ctaSub, { color: colors.mutedForeground }]}>
                    {returnableItems.length}{" "}
                    {returnableItems.length === 1 ? "item" : "items"} still returnable
                  </Text>
                </View>
              </View>
              <Feather name="arrow-right" size={18} color={colors.primary} />
            </TouchableOpacity>

            {attentionItems.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.attentionRow}
              >
                {attentionItems.map((a) => (
                  <TouchableOpacity
                    key={a.key}
                    style={[
                      styles.attentionCard,
                      { backgroundColor: a.color + "12", borderColor: a.color + "30" },
                    ]}
                    onPress={a.onPress}
                    activeOpacity={0.75}
                  >
                    <Feather name={a.icon} size={16} color={a.color} />
                    <Text style={[styles.attentionNum, { color: a.color }]}>{a.count}</Text>
                    <Text style={[styles.attentionLabel, { color: colors.mutedForeground }]}>
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.recentHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Purchases</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/vault")}>
                <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>

            <View>
              {recentItems.map((item) => (
                <PurchaseCard key={item.id} item={item} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  logo: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.4,
  },
  greeting: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  bellDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#070A0F",
  },
  scroll: { paddingHorizontal: 20, gap: 14 },
  emptyHero: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingTop: 48,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.4,
    textAlign: "center",
  },
  emptySub: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyBtn: {
    marginTop: 8,
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLeft: { gap: 2 },
  heroAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    letterSpacing: -1,
  },
  heroLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  heroBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  ctaCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ctaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  ctaIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { gap: 3 },
  ctaTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  ctaSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  attentionRow: {
    gap: 10,
    flexDirection: "row",
  },
  attentionCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
    minWidth: 100,
  },
  attentionNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.5,
  },
  attentionLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textAlign: "center",
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    letterSpacing: -0.3,
  },
  viewAll: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
});
