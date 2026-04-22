import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { AppColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

type ResetPasswordRouteParams = {
  ResetPassword: {
    token: string;
  };
};

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ResetPasswordRouteParams, "ResetPassword">>();

  const { token } = route.params || { token: "" };

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [success, setSuccess] = useState(false);
  const [businessName, setBusinessName] = useState("");

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
  ];

  const allRequirementsMet = passwordRequirements.every((req) => req.met);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setTokenError("Invalid reset link. Please request a new password reset.");
      setIsVerifying(false);
      return;
    }

    try {
      const response = await fetch(
        new URL(`/api/clients/verify-reset-token/${token}`, getApiUrl()).toString()
      );

      const data = await response.json();

      if (response.ok && data.valid) {
        setBusinessName(data.businessName);
      } else {
        setTokenError(data.error || "Invalid or expired reset link.");
      }
    } catch (err) {
      setTokenError("Unable to verify reset link. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (!allRequirementsMet) {
      setError("Please ensure your password meets all requirements.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords don't match.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        new URL("/api/clients/reset-password", getApiUrl()).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      setError("Unable to connect. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate("Login" as never);
  };

  if (isVerifying) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={AppColors.orangePrimary} />
        <ThemedText style={styles.verifyingText}>Verifying reset link...</ThemedText>
      </View>
    );
  }

  if (tokenError) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[AppColors.orangePrimary, AppColors.orangeLight]}
          style={styles.headerGradient}
        >
          <View style={[styles.headerContent, { paddingTop: insets.top + Spacing.xl }]}>
            <View style={[styles.iconWrapper, { backgroundColor: "#FFEBEE" }]}>
              <Feather name="x-circle" size={32} color="#E53935" />
            </View>
            <ThemedText type="h2" style={styles.headerTitle}>Link Expired</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              This password reset link is no longer valid
            </ThemedText>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          }}
        >
          <View style={[styles.card, Shadows.card]}>
            <View style={styles.errorContent}>
              <ThemedText style={styles.errorDescription}>{tokenError}</ThemedText>
              <ThemedText style={styles.errorHint}>
                Password reset links expire after 1 hour. Please request a new one from the login page.
              </ThemedText>
            </View>
          </View>

          <Pressable style={styles.submitButton} onPress={handleBackToLogin}>
            <ThemedText style={styles.submitButtonText}>Back to Login</ThemedText>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[AppColors.orangePrimary, AppColors.orangeLight]}
          style={styles.headerGradient}
        >
          <View style={[styles.headerContent, { paddingTop: insets.top + Spacing.xl }]}>
            <View style={styles.iconWrapper}>
              <Feather name="check" size={32} color="#4CAF50" />
            </View>
            <ThemedText type="h2" style={styles.headerTitle}>Password Reset!</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Your password has been successfully updated
            </ThemedText>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          }}
        >
          <View style={[styles.card, Shadows.card]}>
            <View style={styles.successContent}>
              <View style={styles.successIcon}>
                <Feather name="check-circle" size={48} color="#4CAF50" />
              </View>
              <ThemedText type="h4" style={styles.successTitle}>All Done!</ThemedText>
              <ThemedText style={styles.successText}>
                You can now log in with your new password.
              </ThemedText>
            </View>
          </View>

          <Pressable style={styles.submitButton} onPress={handleBackToLogin}>
            <ThemedText style={styles.submitButtonText}>Go to Login</ThemedText>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

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
          <ThemedText type="h2" style={styles.headerTitle}>Reset Password</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Create a new password for your account
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
          {businessName ? (
            <View style={styles.welcomeSection}>
              <ThemedText style={styles.welcomeLabel}>Resetting password for</ThemedText>
              <ThemedText type="h4" style={styles.businessName}>{businessName}</ThemedText>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={16} color="#E53935" />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>New Password</ThemedText>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter new password"
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
                placeholder="Confirm new password"
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
          style={[styles.submitButton, (!allRequirementsMet || !passwordsMatch || isLoading) && styles.submitButtonDisabled]}
          onPress={handleResetPassword}
          disabled={!allRequirementsMet || !passwordsMatch || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={AppColors.white} />
          ) : (
            <ThemedText style={styles.submitButtonText}>Reset Password</ThemedText>
          )}
        </Pressable>

        <Pressable style={styles.backButton} onPress={handleBackToLogin}>
          <Feather name="arrow-left" size={18} color={AppColors.orangePrimary} />
          <ThemedText style={styles.backButtonText}>Back to Login</ThemedText>
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  verifyingText: {
    color: AppColors.secondaryText,
    marginTop: Spacing.lg,
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
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: "#E53935",
    marginLeft: Spacing.sm,
    fontSize: 14,
    flex: 1,
  },
  errorContent: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  errorDescription: {
    color: AppColors.primaryText,
    textAlign: "center",
    fontSize: 15,
    marginBottom: Spacing.md,
  },
  errorHint: {
    color: AppColors.secondaryText,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
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
    marginBottom: Spacing.lg,
  },
  submitButtonDisabled: {
    backgroundColor: AppColors.tertiaryText,
  },
  submitButtonText: {
    color: AppColors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  backButtonText: {
    color: AppColors.orangePrimary,
    fontWeight: "600",
    fontSize: 15,
  },
  successContent: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  successIcon: {
    marginBottom: Spacing.lg,
  },
  successTitle: {
    color: AppColors.primaryText,
    marginBottom: Spacing.md,
  },
  successText: {
    color: AppColors.secondaryText,
    textAlign: "center",
    lineHeight: 22,
  },
});
