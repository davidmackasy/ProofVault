import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { formatCurrency, usePurchases } from "@/context/PurchaseContext";
import { useColors } from "@/hooks/useColors";

type SettingsRow = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userEmail, userName, signOut } = useAuth();
  const { items, totalProtectedValue } = usePurchases();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0) + 16;
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90;

  const initials = userName
    ? userName.substring(0, 2).toUpperCase()
    : (userEmail.substring(0, 2) ?? "PV").toUpperCase();

  const handleSignOut = () => {
    if (Platform.OS === "web") {
      signOut().then(() => router.replace("/(auth)/sign-in"));
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  const sections: { title: string; rows: SettingsRow[] }[] = [
    {
      title: "Account",
      rows: [
        { icon: "settings", label: "Account Settings", onPress: () => {} },
        { icon: "bell", label: "Notifications", onPress: () => {} },
        {
          icon: "moon",
          label: "Dark Mode",
          right: <Switch value={true} disabled trackColor={{ true: colors.primary }} />,
        },
      ],
    },
    {
      title: "ProofVault",
      rows: [
        {
          icon: "zap",
          label: "Subscription",
          right: (
            <View style={[styles.premiumBadge, { backgroundColor: colors.primary + "22" }]}>
              <Text style={[styles.premiumText, { color: colors.primary }]}>Free</Text>
            </View>
          ),
          onPress: () => {},
        },
        { icon: "download", label: "Export Data", onPress: () => {} },
      ],
    },
    {
      title: "Support",
      rows: [
        { icon: "help-circle", label: "Help & Support", onPress: () => {} },
        { icon: "file-text", label: "Terms & Privacy", onPress: () => {} },
      ],
    },
    {
      title: "",
      rows: [
        { icon: "log-out", label: "Sign Out", danger: true, onPress: handleSignOut },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.avatarSection, { borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
            <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {userName || userEmail.split("@")[0]}
            </Text>
            <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{userEmail}</Text>
          </View>
          <TouchableOpacity>
            <Feather name="settings" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {[
            { value: formatCurrency(totalProtectedValue), label: "Protected Value" },
            { value: String(items.length), label: "Items Saved" },
            {
              value: `${Math.round(
                (items.filter((i) => i.proofComplete).length / Math.max(items.length, 1)) * 100
              )}%`,
              label: "Protection Score",
            },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {sections.map((section, si) => (
          <View key={si} style={styles.sectionBlock}>
            {section.title ? (
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                {section.title.toUpperCase()}
              </Text>
            ) : null}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {section.rows.map((row, ri) => (
                <TouchableOpacity
                  key={ri}
                  style={[
                    styles.settingsRow,
                    ri < section.rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    row.onPress?.();
                  }}
                  activeOpacity={row.onPress ? 0.7 : 1}
                >
                  <View style={[styles.rowIcon, { backgroundColor: row.danger ? colors.danger + "18" : colors.muted }]}>
                    <Feather
                      name={row.icon}
                      size={17}
                      color={row.danger ? colors.danger : colors.mutedForeground}
                    />
                  </View>
                  <Text
                    style={[
                      styles.rowLabel,
                      { color: row.danger ? colors.danger : colors.text },
                    ]}
                  >
                    {row.label}
                  </Text>
                  <View style={styles.rowRight}>
                    {row.right ?? (
                      row.onPress ? <Feather name="chevron-right" size={16} color={colors.border} /> : null
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 0 },
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingBottom: 20,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  initials: { fontFamily: "Inter_700Bold", fontSize: 20 },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  userEmail: { fontFamily: "Inter_400Regular", fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    alignItems: "center",
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 16, letterSpacing: -0.3 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 10, textAlign: "center" },
  sectionBlock: { marginBottom: 20 },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15 },
  rowRight: { alignItems: "center", justifyContent: "center" },
  premiumBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  premiumText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
});
