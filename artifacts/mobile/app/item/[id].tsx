import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StatusBadge } from "@/components/StatusBadge";
import {
  daysFromNow,
  formatCurrency,
  formatDate,
  usePurchases,
} from "@/context/PurchaseContext";
import { useColors } from "@/hooks/useColors";

const PROOF_TYPE_LABELS: Record<string, string> = {
  receipt: "Receipt",
  online_order: "Order Screenshot",
  item_photo: "Item Photo",
  serial_number: "Serial Number",
  box_photo: "Box Photo",
  warranty_card: "Warranty Card",
  notes: "Notes",
};

export default function ItemDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getItem, archiveItem } = usePurchases();
  const item = getItem(id ?? "");

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 24;

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
            Purchase not found
          </Text>
        </View>
      </View>
    );
  }

  const returnDays = daysFromNow(item.returnDeadline);
  const warrantyDays = daysFromNow(item.warrantyExpiry);

  const handleArchive = () => {
    if (Platform.OS === "web") {
      archiveItem(item.id);
      router.back();
      return;
    }
    Alert.alert("Archive Item", "Move this item to archive?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        onPress: async () => {
          await archiveItem(item.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
      },
    ]);
  };

  const proofCount = item.proofPack.length;
  const maxProof = 6;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Item Details</Text>
        <TouchableOpacity>
          <Feather name="more-horizontal" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.itemIcon, { backgroundColor: colors.muted }]}>
            <Feather name="package" size={36} color={colors.mutedForeground} />
          </View>
          <View style={styles.heroInfo}>
            <StatusBadge status={item.status} />
            <Text style={[styles.itemName, { color: colors.text }]}>{item.itemName}</Text>
            {item.itemDescription ? (
              <Text style={[styles.itemDesc, { color: colors.mutedForeground }]}>
                {item.itemDescription}
              </Text>
            ) : null}
            <Text style={[styles.store, { color: colors.mutedForeground }]}>
              {item.storeName ?? "Unknown store"}
            </Text>
          </View>
          {item.totalAmount !== undefined && (
            <Text style={[styles.price, { color: colors.text }]}>
              {formatCurrency(item.totalAmount, item.currency)}
            </Text>
          )}
        </View>

        <View style={styles.deadlinesRow}>
          {returnDays !== null && (
            <View
              style={[
                styles.deadlineCard,
                {
                  backgroundColor: returnDays <= 7 ? colors.danger + "18" : returnDays <= 14 ? colors.warning + "18" : colors.card,
                  borderColor: returnDays <= 7 ? colors.danger + "40" : returnDays <= 14 ? colors.warning + "40" : colors.border,
                },
              ]}
            >
              <Feather
                name="rotate-ccw"
                size={16}
                color={returnDays <= 7 ? colors.danger : returnDays <= 14 ? colors.warning : colors.mutedForeground}
              />
              <Text style={[styles.deadlineLabel, { color: colors.mutedForeground }]}>
                Return Deadline
              </Text>
              {returnDays > 0 ? (
                <Text
                  style={[
                    styles.deadlineDays,
                    { color: returnDays <= 7 ? colors.danger : returnDays <= 14 ? colors.warning : colors.text },
                  ]}
                >
                  {returnDays}d left
                </Text>
              ) : (
                <Text style={[styles.deadlineDays, { color: colors.mutedForeground }]}>Expired</Text>
              )}
              <Text style={[styles.deadlineDate, { color: colors.mutedForeground }]}>
                {formatDate(item.returnDeadline)}
              </Text>
            </View>
          )}
          {warrantyDays !== null && (
            <View
              style={[
                styles.deadlineCard,
                {
                  backgroundColor: warrantyDays <= 30 ? colors.warning + "18" : colors.card,
                  borderColor: warrantyDays <= 30 ? colors.warning + "40" : colors.border,
                },
              ]}
            >
              <Feather
                name="shield"
                size={16}
                color={warrantyDays <= 30 ? colors.warning : colors.mutedForeground}
              />
              <Text style={[styles.deadlineLabel, { color: colors.mutedForeground }]}>
                Warranty Expires
              </Text>
              {warrantyDays > 0 ? (
                <Text
                  style={[
                    styles.deadlineDays,
                    { color: warrantyDays <= 30 ? colors.warning : colors.text },
                  ]}
                >
                  {warrantyDays}d left
                </Text>
              ) : (
                <Text style={[styles.deadlineDays, { color: colors.mutedForeground }]}>Expired</Text>
              )}
              <Text style={[styles.deadlineDate, { color: colors.mutedForeground }]}>
                {formatDate(item.warrantyExpiry)}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PURCHASE DETAILS</Text>
          {[
            { label: "Purchase Date", value: formatDate(item.purchaseDate) },
            { label: "Store", value: item.storeName },
            { label: "Category", value: item.category },
            { label: "Receipt #", value: item.receiptNumber },
            { label: "Order #", value: item.orderNumber },
          ]
            .filter((r) => r.value)
            .map((row) => (
              <View key={row.label} style={[styles.detailRow, { borderColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{row.value}</Text>
              </View>
            ))}
        </View>

        <View style={[styles.proofCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.proofHeader}>
            <View>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PROOF PACK</Text>
              <Text style={[styles.proofCount, { color: colors.mutedForeground }]}>
                {proofCount} of {maxProof} completed
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.viewProofBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/proof-pack/${item.id}` as any)}
            >
              <Text style={[styles.viewProofText, { color: colors.primaryForeground }]}>
                Open
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: proofCount >= maxProof ? colors.success : colors.primary,
                  width: `${(proofCount / maxProof) * 100}%` as any,
                },
              ]}
            />
          </View>
          <View style={styles.proofTypes}>
            {item.proofPack.slice(0, 3).map((p) => (
              <View
                key={p.id}
                style={[styles.proofChip, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" }]}
              >
                <Feather name="check" size={10} color={colors.primary} />
                <Text style={[styles.proofChipText, { color: colors.primary }]}>
                  {PROOF_TYPE_LABELS[p.type] ?? p.type}
                </Text>
              </View>
            ))}
            {item.proofPack.length > 3 && (
              <Text style={[styles.moreProof, { color: colors.mutedForeground }]}>
                +{item.proofPack.length - 3} more
              </Text>
            )}
          </View>
        </View>

        {item.notes ? (
          <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NOTES</Text>
            <Text style={[styles.notesText, { color: colors.text }]}>{item.notes}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/proof-pack/${item.id}` as any)}
            activeOpacity={0.85}
          >
            <Feather name="shield" size={18} color={colors.primaryForeground} />
            <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Open Proof Pack</Text>
          </TouchableOpacity>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/add-purchase?itemId=${item.id}` as any)}
            >
              <Feather name="plus" size={16} color={colors.text} />
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Add Proof</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleArchive}
            >
              <Feather name="archive" size={16} color={colors.mutedForeground} />
              <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>Archive</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    justifyContent: "space-between",
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  scroll: { paddingHorizontal: 20, gap: 12 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontFamily: "Inter_400Regular", fontSize: 16 },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  itemIcon: {
    width: 68,
    height: 68,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroInfo: { gap: 6 },
  itemName: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.4 },
  itemDesc: { fontFamily: "Inter_400Regular", fontSize: 14 },
  store: { fontFamily: "Inter_400Regular", fontSize: 13 },
  price: { fontFamily: "Inter_700Bold", fontSize: 24, letterSpacing: -0.5 },
  deadlinesRow: { flexDirection: "row", gap: 10 },
  deadlineCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  deadlineLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4 },
  deadlineDays: { fontFamily: "Inter_700Bold", fontSize: 20, letterSpacing: -0.4 },
  deadlineDate: { fontFamily: "Inter_400Regular", fontSize: 11 },
  detailCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 0 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  detailLabel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  detailValue: { fontFamily: "Inter_500Medium", fontSize: 13 },
  proofCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  proofHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  proofCount: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  viewProofBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewProofText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  progressBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  proofTypes: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  proofChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  proofChipText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  moreProof: { fontFamily: "Inter_400Regular", fontSize: 11, alignSelf: "center" },
  notesCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  notesText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginTop: 6 },
  actions: { gap: 10, paddingTop: 4 },
  actionBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  actionRow: { flexDirection: "row", gap: 10 },
  secondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    gap: 6,
  },
  secondaryBtnText: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
