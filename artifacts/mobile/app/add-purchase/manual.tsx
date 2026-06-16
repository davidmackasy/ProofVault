import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
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

import { useAddPurchaseFlow } from "@/context/AddPurchaseFlowContext";
import { usePurchases } from "@/context/PurchaseContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["Electronics", "Home", "Kitchen", "Clothing", "Sports", "Other"];

export default function ManualAddScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addItem } = usePurchases();
  const { capturedReceiptUri, clearCapturedReceipt } = useAddPurchaseFlow();

  const [form, setForm] = useState({
    itemName: "",
    storeName: "",
    category: "",
    purchaseDate: "",
    totalAmount: "",
    currency: "USD",
    returnDeadline: "",
    warrantyExpiry: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 16;
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 24;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.itemName.trim()) e.itemName = "Item name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const hasReceipt = !!capturedReceiptUri;
      const id = await addItem({
        itemName: form.itemName.trim(),
        storeName: form.storeName || undefined,
        category: form.category || undefined,
        purchaseDate: form.purchaseDate || undefined,
        totalAmount: form.totalAmount ? parseFloat(form.totalAmount) : undefined,
        currency: form.currency,
        returnDeadline: form.returnDeadline || undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
        notes: form.notes || undefined,
        status: hasReceipt ? "returnable" : "needs_proof",
        proofComplete: hasReceipt,
        proofPack: hasReceipt
          ? [
              {
                id: "",
                itemId: "",
                userId: "user1",
                type: "receipt",
                fileUrl: capturedReceiptUri!,
                createdAt: new Date().toISOString(),
              },
            ]
          : [],
        sourceType: hasReceipt ? "physical_receipt" : "manual",
      });
      clearCapturedReceipt();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/item/${id}` as any);
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof typeof form, props?: any) => (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View
        style={[
          styles.fieldBox,
          {
            backgroundColor: colors.card,
            borderColor: errors[key] ? colors.danger : colors.border,
          },
        ]}
      >
        <TextInput
          style={[styles.fieldInput, { color: colors.text }]}
          value={String(form[key])}
          onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
          placeholderTextColor={colors.mutedForeground}
          placeholder={`Enter ${label.toLowerCase()}`}
          {...props}
        />
      </View>
      {errors[key] ? (
        <Text style={[styles.errorMsg, { color: colors.danger }]}>{errors[key]}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Add Manually</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {capturedReceiptUri ? (
          <View
            style={[
              styles.receiptPreview,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              ATTACHED RECEIPT
            </Text>
            <Image
              source={{ uri: capturedReceiptUri }}
              style={styles.receiptImage}
              contentFit="contain"
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            ITEM DETAILS
          </Text>
          {field("Item Name *", "itemName")}
          {field("Store / Merchant", "storeName")}
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: form.category === cat ? colors.primary : colors.card,
                      borderColor: form.category === cat ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setForm((f) => ({ ...f, category: cat }))}
                >
                  <Text
                    style={[
                      styles.catLabel,
                      { color: form.category === cat ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            PURCHASE INFO
          </Text>
          {field("Purchase Date", "purchaseDate", { placeholder: "Add purchase date" })}
          {field("Total Amount", "totalAmount", { keyboardType: "decimal-pad" })}
          {field("Currency", "currency")}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            PROTECTION
          </Text>
          {field("Return Deadline (YYYY-MM-DD)", "returnDeadline")}
          {field("Warranty Expiry (YYYY-MM-DD)", "warrantyExpiry")}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NOTES</Text>
          <View style={[styles.notesBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.notesInput, { color: colors.text }]}
              value={form.notes}
              onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
              placeholder="Personal notes about this purchase..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 },
          ]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Feather name="check" size={18} color={colors.primaryForeground} />
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
            {saving ? "Saving..." : "Save Purchase"}
          </Text>
        </TouchableOpacity>
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
  scroll: { paddingHorizontal: 20, gap: 20 },
  receiptPreview: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  receiptImage: { width: "100%", height: 160, borderRadius: 10 },
  section: { gap: 12 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1 },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  fieldBox: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, justifyContent: "center" },
  fieldInput: { fontFamily: "Inter_400Regular", fontSize: 15 },
  errorMsg: { fontFamily: "Inter_400Regular", fontSize: 12 },
  catScroll: { marginTop: 2 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  catLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  notesBox: { borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 80 },
  notesInput: { fontFamily: "Inter_400Regular", fontSize: 15, textAlignVertical: "top" },
  saveBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
});
