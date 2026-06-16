import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    icon: "shield" as const,
    headline: "Your purchases\nhave deadlines.",
    body: "ProofVault keeps you protected before return windows and warranties expire.",
    accentIcon: "check-circle" as const,
  },
  {
    id: "2",
    icon: "clock" as const,
    headline: "Track return\nwindows & warranties.",
    body: "Know exactly how many days you have left to return, claim warranty, or get proof.",
    accentIcon: "bell" as const,
  },
  {
    id: "3",
    icon: "lock" as const,
    headline: "Everything protected.\nAlways ready.",
    body: "Scan receipts, upload proof, and access everything when you need it most.",
    accentIcon: "zap" as const,
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLast = activeIndex === SLIDES.length - 1;

  const handleNext = async () => {
    if (isLast) {
      await completeOnboarding();
      router.replace("/(auth)/sign-up");
    } else {
      const next = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace("/(auth)/sign-in");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#070A0F", "#0D1117", "#070A0F"]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16 },
        ]}
      >
        <Text style={[styles.logo, { color: colors.primary }]}>ProofVault</Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[styles.skip, { color: colors.mutedForeground }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={[styles.heroIcon, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
              <Feather name={item.icon} size={52} color={colors.primary} />
            </View>
            <Text style={[styles.headline, { color: colors.text }]}>{item.headline}</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>{item.body}</Text>
          </View>
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}
      />

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 24 },
        ]}
      >
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === activeIndex ? colors.primary : colors.border,
                  width: i === activeIndex ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
            {isLast ? "Get Started" : "Continue"}
          </Text>
          <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  logo: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: -0.3,
  },
  skip: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 24,
    flex: 1,
  },
  heroIcon: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headline: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    textAlign: "center",
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 24,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  btn: {
    width: "100%",
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
});
