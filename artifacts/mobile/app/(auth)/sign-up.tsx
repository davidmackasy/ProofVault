import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function SignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async () => {
    setError("");
    if (!email.trim()) { setError("Email is required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords don't match"); return; }

    setLoading(true);
    try {
      await signUp(email.trim(), password, "");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch {
      setError("Account creation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 40,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 32,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.primary }]}>ProofVault</Text>
          <Text style={[styles.title, { color: colors.text }]}>Create your account</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Protect what you buy. We'll handle the rest.
          </Text>
        </View>

        <View style={styles.benefits}>
          {[
            "Bank-level encryption",
            "Your data is always private",
            "No spam, ever",
          ].map((b) => (
            <View key={b} style={styles.benefitRow}>
              <Feather name="check-circle" size={14} color={colors.success} />
              <Text style={[styles.benefitText, { color: colors.mutedForeground }]}>{b}</Text>
            </View>
          ))}
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.danger + "18", borderColor: colors.danger + "44" }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="mail" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email address"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="lock" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="lock" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Confirm password"
              placeholderTextColor={colors.mutedForeground}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.mutedForeground }]}>or</Text>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.appleBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            <Feather name="smartphone" size={18} color={colors.text} />
            <Text style={[styles.appleBtnText, { color: colors.text }]}>Sign up with Apple</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.legal, { color: colors.mutedForeground }]}>
          By creating an account, you agree to our{" "}
          <Text style={{ color: colors.accent }}>Terms</Text> and{" "}
          <Text style={{ color: colors.accent }}>Privacy Policy</Text>.
        </Text>

        <View style={styles.signinRow}>
          <Text style={[styles.signinLabel, { color: colors.mutedForeground }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
            <Text style={[styles.signinLink, { color: colors.primary }]}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 0 },
  header: { gap: 8, marginBottom: 20 },
  logo: { fontFamily: "Inter_700Bold", fontSize: 14, letterSpacing: 0.5 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.6 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15 },
  benefits: { gap: 8, marginBottom: 24 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  benefitText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  form: { gap: 12 },
  errorBox: { borderRadius: 10, borderWidth: 1, padding: 12 },
  errorText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  btn: { height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  line: { flex: 1, height: 1 },
  orText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  appleBtn: {
    flexDirection: "row",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
  },
  appleBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  legal: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: 20 },
  signinRow: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  signinLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  signinLink: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
