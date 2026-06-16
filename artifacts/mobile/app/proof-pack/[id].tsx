import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
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

import { ProofPackItem } from "@/components/ProofPackItem";
import { usePurchases } from "@/context/PurchaseContext";
import { useColors } from "@/hooks/useColors";
import { ProofType } from "@/types";

const ALL_PROOF_TYPES: ProofType[] = [
  "receipt",
  "online_order",
  "item_photo",
  "serial_number",
  "box_photo",
  "warranty_card",
  "notes",
];

export default function ProofPackScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getItem, addProofFile } = usePurchases();
  const item = getItem(id ?? "");

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 32;

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  }

  const addedTypes = new Set(item.proofPack.map((p) => p.type));
  const proofByType = Object.fromEntries(
    item.proofPack.map((p) => [p.type, p])
  ) as Partial<Record<ProofType, (typeof item.proofPack)[number]>>;
  const imageProofs = item.proofPack.filter((p) => p.fileUrl);
  const total = ALL_PROOF_TYPES.length;
  const completed = addedTypes.size;
  const pct = Math.round((completed / total) * 100);

  const handleAddProof = async (type: ProofType) => {
    if (type === "notes") {
      await addProofFile(item.id, { itemId: item.id, userId: "user1", type: "notes", textValue: "Added note" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    if (Platform.OS === "web") {
      await addProofFile(item.id, { itemId: item.id, userId: "user1", type });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await addProofFile(item.id, {
        itemId: item.id,
        userId: "user1",
        type,
        fileUrl: result.assets[0].uri,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Proof Pack</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {item.itemName}
          </Text>
        </View>
        <TouchableOpacity>
          <Feather name="share-2" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.progressTitle, { color: colors.text }]}>
                {completed >= total ? "Fully Protected" : "Add proof to complete"}
              </Text>
              <Text style={[styles.progressSub, { color: colors.mutedForeground }]}>
                {completed} of {total} completed
              </Text>
            </View>
            <View style={[styles.pctCircle, { borderColor: pct >= 100 ? colors.success : colors.primary }]}>
              <Text
                style={[
                  styles.pctText,
                  { color: pct >= 100 ? colors.success : colors.primary },
                ]}
              >
                {pct}%
              </Text>
            </View>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: pct >= 100 ? colors.success : colors.primary,
                  width: `${pct}%` as any,
                },
              ]}
            />
          </View>
        </View>

        {imageProofs.length > 0 ? (
          <View
            style={[
              styles.galleryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              SAVED PROOF
            </Text>
            {imageProofs.map((proof) => (
              <View
                key={proof.id}
                style={[
                  styles.galleryItem,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
              >
                <Image
                  source={{ uri: proof.fileUrl! }}
                  style={styles.galleryImage}
                  contentFit="contain"
                />
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {ALL_PROOF_TYPES.map((type) => (
            <ProofPackItem
              key={type}
              type={type}
              added={addedTypes.has(type)}
              fileUrl={proofByType[type]?.fileUrl}
              onPress={() => {
                if (addedTypes.has(type)) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleAddProof(type);
              }}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.exportBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="download" size={18} color={colors.mutedForeground} />
          <Text style={[styles.exportText, { color: colors.mutedForeground }]}>
            Export Proof Pack
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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  progressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  progressSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 3 },
  pctCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pctText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  galleryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
  },
  galleryItem: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  galleryImage: { width: "100%", height: "100%" },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  exportBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  exportText: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
