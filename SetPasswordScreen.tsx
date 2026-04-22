import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { AppColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

type SetPasswordRouteParams = {
  SetPassword: {
    token: string;
    email: string;
    businessName: string;
  };
};

export default function SetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<SetPasswordRouteParams, "SetPassword">>();
  
  const { email, businessName } = route.params || { email: "", businessName: "" };

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
  ];

  const allRequirementsMet = passwordRequirements.every(req => req.met);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSetPassword = async () => {
    if (!allRequirementsMet) {
      Alert.alert("Password Requirements", "Please ensure your password meets all requirements.");
      return;
    }
    if (!passwordsMatch) {
      Alert.alert("Passwords Don't Match", "Please make sure both passwords are the same.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = route.params?.token;
      const url = new URL("/api/set-password", getApiUrl());
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert("Error", data.error || "Failed to set password. Please try again.");
        return;
      }
      Alert.alert(
        "Account Created!",
        "Your password has been set successfully. You can now log in to the app.",
        [{ text: "Go to Login", onPress: () => navigation.navigate("Login" as never) }]
      );
    } catch {
      Alert.alert("Error", "Something went wrong. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[AppColors.orangePrimary, AppColors.orangeLight]}
        style={styles.headerGradient}
      >
        <View style={[styles.headerContent, { paddingTop: insets.top + Spacing.xl }]}>
          <View style={styles.iconWrapper}>
            <Feather name="lock" size={32} color={AppColors.orangePrimary} />
          </View>
          <ThemedText type="h2" style={styles.headerTitle}>Set Your Password</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Welcome to Blossom and Bloom Marketing
          </ThemedText>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.welcomeSection}>
            <ThemedText style={styles.welcomeLabel}>Setting up account for</ThemedText>
            <ThemedText type="h4" style={styles.businessName}>{businessName}</ThemedText>
            <ThemedText style={styles.email}>{email}</ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Create Password</ThemedText>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={AppColors.tertiaryText}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color={AppColors.secondaryText} />
              </Pressable>
            </View>
          </View>

          <View style={styles.requirementsContainer}>
            {passwordRequirements.map((req, index) => (
              <View key={index} style={styles.requirementRow}>
                <Feather 
                  name={req.met ? "check-circle" : "circle"} 
                  size={16} 
                  color={req.met ? "#4CAF50" : AppColors.tertiaryText} 
                />
                <ThemedText style={[styles.requirementText, req.met && styles.requirementMet]}>
                  {req.label}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Confirm Password</ThemedText>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor={AppColors.tertiaryText}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={AppColors.secondaryText} />
              </Pressable>
            </View>
            {confirmPassword.length > 0 ? (
              <View style={styles.matchIndicator}>
                <Feather 
                  name={passwordsMatch ? "check-circle" : "x-circle"} 
                  size={14} 
                  color={passwordsMatch ? "#4CAF50" : AppColors.error} 
                />
                <ThemedText style={[styles.matchText, { color: passwordsMatch ? "#4CAF50" : AppColors.error }]}>
                  {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        <Pressable 
          style={[styles.submitButton, (!allRequirementsMet || !passwordsMatch || isSubmitting) && styles.submitButtonDisabled]} 
          onPress={handleSetPassword}
          disabled={!allRequirementsMet || !passwordsMatch || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={AppColors.white} />
          ) : (
            <ThemedText style={styles.submitButtonText}>Create Account</ThemedText>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  headerGradient: {
    paddingBottom: Spacing["3xl"],
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    color: AppColors.white,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginTop: -Spacing.xl,
    marginBottom: Spacing.xl,
  },
  welcomeSection: {
    alignItems: "center",
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral,
    marginBottom: Spacing.xl,
  },
  welcomeLabel: {
    color: AppColors.secondaryText,
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  businessName: {
    color: AppColors.primaryText,
    marginBottom: Spacing.xs,
  },
  email: {
    color: AppColors.orangePrimary,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: AppColors.primaryText,
    fontWeight: "600",
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: AppColors.neutral,
  },
  passwordInput: {
    flex: 1,
    padding: Spacing.lg,
    fontSize: 15,
    color: AppColors.primaryText,
  },
  eyeButton: {
    padding: Spacing.lg,
  },
  requirementsContainer: {
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  requirementText: {
    color: AppColors.tertiaryText,
    fontSize: 13,
  },
  requirementMet: {
    color: "#4CAF50",
  },
  matchIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  matchText: {
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: AppColors.orangePrimary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: AppColors.tertiaryText,
  },
  submitButtonText: {
    color: AppColors.white,
    fontWeight: "700",
    fontSize: 16,
  },
});
