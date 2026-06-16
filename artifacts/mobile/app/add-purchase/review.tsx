import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  toExtractionResult,
  useAddPurchaseFlow,
} from "@/context/AddPurchaseFlowContext";
import { usePurchases } from "@/context/PurchaseContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["Electronics", "Home", "Kitchen", "Clothing", "Sports", "Other"];

function defaultReturnDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0]!;
}

function defaultWarrantyExpiry() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0]!;
}

export default function ReviewDetailsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { savePurchase } = usePurchases();
  const {
    capturedReceiptUri,
    receiptSignedUrl,
    receiptStoragePath,
    extractionResult,
    readStatus,
    clearCapturedReceipt,
  } = useAddPurchaseFlow();

  const [form, setForm] = useState({
    itemName: "",
    storeName: "",
    category: "",
    purchaseDate: new Date().toISOString().split("T")[0]!,
    purchaseTime: "",
    totalAmount: "",
    currency: "USD",
    receiptNumber: "",
    orderNumber: "",
    returnDeadline: defaultReturnDeadline(),
    warrantyExpiry: defaultWarrantyExpiry(),
    returnPolicyText: "",
    warrantyText: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 16;
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 24;

  const receiptImageUri = receiptSignedUrl ?? capturedReceiptUri;

  useEffect(() => {
    if (!capturedReceiptUri && !receiptSignedUrl) {
      router.replace("/add-purchase/camera" as any);
    }
  }, [capturedReceiptUri, receiptSignedUrl]);

  useEffect(() => {
    if (!extractionResult) return;
    setForm((f) => ({
      ...f,
      itemName: extractionResult.suggestedItemName ?? extractionResult.itemName ?? f.itemName,
      storeName: extractionResult.suggestedStoreName ?? f.storeName,
      purchaseDate: extractionResult.suggestedPurchaseDate ?? f.purchaseDate,
      purchaseTime: extractionResult.suggestedPurchaseTime ?? f.purchaseTime,
      totalAmount:
        extractionResult.suggestedTotalAmount != null
          ? String(extractionResult.suggestedTotalAmount)
          : f.totalAmount,
      currency: extractionResult.suggestedCurrency ?? f.currency,
      receiptNumber: extractionResult.suggestedReceiptNumber ?? f.receiptNumber,
      orderNumber: extractionResult.suggestedOrderNumber ?? f.orderNumber,
      returnPolicyText: extractionResult.returnPolicyText ?? f.returnPolicyText,
      warrantyText: extractionResult.warrantyText ?? f.warrantyText,
    }));
  }, [extractionResult]);

  const notice = useMemo(() => {
    if (readStatus === "partial" || !extractionResult) {
      return {
        tone: "warning" as const,
        text: "Couldn't read everything. Please add missing details.",
      };
    }
    if ((extractionResult.confidence ?? 0) >= 0.5) {
      return {
        tone: "success" as const,
        text: "We found these details. Please review before saving.",
      };
    }
    return {
      tone: "warning" as const,
      text: "Couldn't read everything. Please add missing details.",
    };
  }, [extractionResult, readStatus]);

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
      const id = await savePurchase({
        itemName: form.itemName.trim(),
        storeName: form.storeName.trim() || undefined,
        category: form.category || undefined,
        purchaseDate: form.purchaseDate || undefined,
        purchaseTime: form.purchaseTime || undefined,
        totalAmount: form.totalAmount ? parseFloat(form.totalAmount) : undefined,
        currency: form.currency,
        receiptNumber: form.receiptNumber.trim() || undefined,
        orderNumber: form.orderNumber.trim() || undefined,
        returnDeadline: form.returnDeadline || undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
        notes: [form.notes, form.returnPolicyText, form.warrantyText]
          .filter(Boolean)
          .join("\n\n")
          .trim() || undefined,
        returnPolicyText: form.returnPolicyText.trim() || undefined,
        warrantyText: form.warrantyText.trim() || undefined,
        sourceType: extractionResult?.sourceType ?? "physical_receipt",
        extractionResult: toExtractionResult(extractionResult),
        receiptStoragePath: receiptStoragePath ?? undefined,
        receiptFileUrl: receiptSignedUrl ?? undefined,
        localReceiptUri: !receiptSignedUrl ? capturedReceiptUri ?? undefined : undefined,
      });
      clearCapturedReceipt();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/item/${id}` as any);
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof typeof form, props?: object) => (
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

  if (!receiptImageUri) return null;

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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.noticeCard,
            {
              backgroundColor:
                (notice.tone === "success" ? colors.success : colors.warning) + "14",
              borderColor:
                (notice.tone === "success" ? colors.success : colors.warning) + "40",
            },
          ]}
        >
          <Feather
            name={notice.tone === "success" ? "check-circle" : "info"}
            size={18}
            color={notice.tone === "success" ? colors.success : colors.warning}
          />
          <Text style={[styles.noticeText, { color: colors.text }]}>{notice.text}</Text>
        </View>

        <View
          style={[
            styles.imageCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Image
            source={{ uri: receiptImageUri }}
            style={styles.image}
            contentFit="contain"
          />
        </View>

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
                      {
                        color:
                          form.category === cat
                            ? colors.primaryForeground
                            : colors.mutedForeground,
                      },
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
          {field("Purchase Date", "purchaseDate")}
          {field("Purchase Time", "purchaseTime")}
          {field("Total Amount", "totalAmount", { keyboardType: "decimal-pad" })}
          {field("Currency", "currency")}
          {field("Receipt Number", "receiptNumber")}
          {field("Order Number", "orderNumber")}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            PROTECTION
          </Text>
          {field("Return Deadline (YYYY-MM-DD)", "returnDeadline")}
          {field("Warranty Expiry (YYYY-MM-DD)", "warrantyExpiry")}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            POLICY NOTES
          </Text>
          <View style={[styles.notesBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.notesInput, { color: colors.text }]}
              value={form.returnPolicyText}
              onChangeText={(v) => setForm((f) => ({ ...f, returnPolicyText: v }))}
              placeholder="Return policy text from receipt (if visible)"
              placeholderTextColor={colors.mutedForeground}
              multiline
            />
          </View>
          <View style={[styles.notesBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.notesInput, { color: colors.text }]}
              value={form.warrantyText}
              onChangeText={(v) => setForm((f) => ({ ...f, warrantyText: v }))}
              placeholder="Warranty text from receipt (if visible)"
              placeholderTextColor={colors.mutedForeground}
              multiline
            />
          </View>
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
          {saving ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Feather name="check" size={18} color={colors.primaryForeground} />
          )}
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
            {saving ? "Saving…" : "Save Purchase"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.replace("/add-purchase/preview" as any)}
          activeOpacity={0.85}
        >
          <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>
            Back to Preview
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
  scroll: { paddingHorizontal: 20, gap: 16 },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  noticeText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  imageCard: {
    height: 200,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  section: { gap: 12 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1 },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  fieldBox: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  fieldInput: { fontFamily: "Inter_400Regular", fontSize: 15, paddingVertical: 10 },
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
  notesBox: { borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 72 },
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
  secondaryBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { fontFamily: "Inter_500Medium", fontSize: 15 },
});
