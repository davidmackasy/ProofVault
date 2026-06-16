import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePurchases } from "@/context/PurchaseContext";
import { useColors } from "@/hooks/useColors";

const MOCK_EXTRACTION = {
  confidence: 0.87,
  storeName: "Best Buy",
  itemName: "Sony WH-1000XM5",
  purchaseDate: "2026-05-29",
  totalAmount: "399.99",
  currency: "USD",
  receiptNumber: "BB-7821345",
  returnPolicyText: "30-day return window",
  warrantyText: "1-year limited warranty",
};

export default function ReviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addItem } = usePurchases();

  const [form, setForm] = useState(MOCK_EXTRACTION);
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 16;
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 24;

  const confidence = form.confidence;
  const confColor =
    confidence >= 0.8 ? colors.success : confidence >= 0.5 ? colors.warning : colors.danger;
  const confLabel =
    confidence >= 0.8 ? "High confidence" : confidence >= 0.5 ? "Medium confidence" : "Needs review";

  const handleSave = async () => {
    const today = new Date();
    const returnDeadline = new Date(today);
    returnDeadline.setDate(returnDeadline.getDate() + 30);
    const warrantyExpiry = new Date(today);
    warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + 1);

    await addItem({
      itemName: form.itemName,
      storeName: form.storeName,
      purchaseDate: form.purchaseDate,
      totalAmount: parseFloat(form.totalAmount) || undefined,
      currency: form.currency,
      receiptNumber: form.receiptNumber,
      returnDeadline: returnDeadline.toISOString().split("T")[0]!,
      warrantyExpiry: warrantyExpiry.toISOString().split("T")[0]!,
      status: "returnable",
      proofComplete: true,
      proofPack: [
        {
          id: Date.now().toString(),
          itemId: "",
          userId: "user1",
          type: "receipt",
          createdAt: new Date().toISOString(),
        },
      ],
      sourceType: "physical_receipt",
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  };

  const fields = [
    { label: "Store / Merchant", key: "storeName" as const },
    { label: "Item Name", key: "itemName" as const },
    { label: "Purchase Date", key: "purchaseDate" as const },
    { label: "Total Amount", key: "totalAmount" as const, keyboardType: "decimal-pad" as const },
    { label: "Currency", key: "currency" as const },
    { label: "Receipt #", key: "receiptNumber" as const },
    { label: "Return Policy", key: "returnPolicyText" as const },
    { label: "Warranty", key: "warrantyText" as const },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Review Details</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.subTitle, { color: colors.mutedForeground }]}>
          Check and confirm the extracted details.
        </Text>

        <View
          style={[
            styles.confBadge,
            { backgroundColor: confColor + "18", borderColor: confColor + "40" },
          ]}
        >
          <Feather name="cpu" size={14} color={confColor} />
          <Text style={[styles.confText, { color: confColor }]}>{confLabel}</Text>
          <Text style={[styles.confPct, { color: confColor }]}>
            {Math.round(confidence * 100)}%
          </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {fields.map((field, i) => (
            <View
              key={field.key}
              style={[
                styles.fieldRow,
                i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                {field.label}
              </Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                value={String(form[field.key] ?? "")}
                onChangeText={(v) => setForm((f) => ({ ...f, [field.key]: v }))}
                keyboardType={field.keyboardType ?? "default"}
                placeholderTextColor={colors.mutedForeground}
                placeholder="Not detected"
              />
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Feather name="check" size={18} color={colors.primaryForeground} />
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
              Confirm & Save
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.manualBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.replace("/add-purchase/manual")}
          >
            <Text style={[styles.manualBtnText, { color: colors.mutedForeground }]}>
              Edit Manually
            </Text>
          </TouchableOpacity>
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  subTitle: { fontFamily: "Inter_400Regular", fontSize: 14 },
  confBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  confText: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
  confPct: { fontFamily: "Inter_700Bold", fontSize: 13 },
  formCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  fieldRow: { paddingHorizontal: 14, paddingVertical: 12 },
  fieldLabel: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 4 },
  fieldInput: { fontFamily: "Inter_500Medium", fontSize: 15 },
  actions: { gap: 10 },
  saveBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  manualBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  manualBtnText: { fontFamily: "Inter_500Medium", fontSize: 15 },
});
