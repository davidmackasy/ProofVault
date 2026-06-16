import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  value: string | number;
  icon?: keyof typeof Feather.glyphMap;
  iconColor?: string;
  onPress?: () => void;
  accent?: boolean;
}

export function MetricCard({ label, value, icon, iconColor, onPress, accent }: Props) {
  const colors = useColors();
  const Wrapper: any = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[
        styles.card,
        {
          backgroundColor: accent ? colors.primary + "18" : colors.card,
          borderColor: accent ? colors.primary + "40" : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <Feather
          name={icon}
          size={16}
          color={iconColor ?? (accent ? colors.primary : colors.mutedForeground)}
          style={styles.icon}
        />
      )}
      <Text style={[styles.value, { color: accent ? colors.primary : colors.text }]}>
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  icon: {
    marginBottom: 2,
  },
  value: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.5,
  },
  label: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
});
