import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const STEPS = [
  { icon: "search" as const, label: "Detecting receipt..." },
  { icon: "cpu" as const, label: "Extracting details..." },
  { icon: "check-circle" as const, label: "Reviewing data..." },
];

export default function ScanningScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0.8)).current;
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();

    const stepTimer = setInterval(() => {
      setStep((s) => {
        if (s >= STEPS.length - 1) {
          clearInterval(stepTimer);
          setTimeout(() => {
            pulse.stop();
            router.replace("/add-purchase/review");
          }, 600);
          return s;
        }
        return s + 1;
      });
    }, 1000);

    return () => {
      pulse.stop();
      clearInterval(stepTimer);
    };
  }, []);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}
    >
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.scanRing,
            {
              borderColor: colors.primary,
              transform: [{ scale: pulseAnim }],
              shadowColor: colors.primary,
            },
          ]}
        >
          <View style={[styles.innerRing, { borderColor: colors.primary + "40" }]}>
            <Feather name="cpu" size={44} color={colors.primary} />
          </View>
        </Animated.View>

        <Text style={[styles.title, { color: colors.text }]}>Extracting details...</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          AI is reading your receipt
        </Text>

        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <View key={s.label} style={styles.stepRow}>
              <View
                style={[
                  styles.stepIcon,
                  {
                    backgroundColor:
                      i < step
                        ? colors.success + "18"
                        : i === step
                        ? colors.primary + "14"
                        : colors.muted,
                  },
                ]}
              >
                <Feather
                  name={i < step ? "check" : s.icon}
                  size={14}
                  color={
                    i < step
                      ? colors.success
                      : i === step
                      ? colors.primary
                      : colors.mutedForeground
                  }
                />
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color:
                      i < step
                        ? colors.success
                        : i === step
                        ? colors.text
                        : colors.mutedForeground,
                    fontFamily:
                      i === step ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  center: { alignItems: "center", gap: 24, paddingHorizontal: 40 },
  scanRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  innerRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.4 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, marginTop: -12 },
  steps: { gap: 10, alignSelf: "stretch" },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: { fontSize: 14 },
});
