import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { AppColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        new URL("/api/clients/forgot-password", getApiUrl()).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase().trim() }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
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

  if (success) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[AppColors.orangePrimary, AppColors.orangeLight]}
          style={styles.headerGradient}
        >
          <View style={[styles.headerContent, { paddingTop: insets.top + Spacing.xl }]}>
            <View style={styles.iconWrapper}>
              <Feather name="mail" size={32} color={AppColors.orangePrimary} />
            </View>
            <ThemedText type="h2" style={styles.headerTitle}>Check Your Email</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              We've sent you a password reset link
            </ThemedText>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, Shadows.card]}>
            <View style={styles.successContent}>
              <View style={styles.successIcon}>
                <Feather name="check-circle" size={48} color="#4CAF50" />
              </View>
              <ThemedText type="h4" style={styles.successTitle}>Email Sent!</ThemedText>
              <ThemedText style={styles.successText}>
                If an account exists for {email}, you'll receive an email with instructions to reset your password.
              </ThemedText>
              <ThemedText style={styles.successNote}>
                The link will expire in 1 hour for security reasons.
              </ThemedText>
            </View>
          </View>

          <Pressable style={styles.backButton} onPress={handleBackToLogin}>
            <Feather name="arrow-left" size={18} color={AppColors.orangePrimary} />
            <ThemedText style={styles.backButtonText}>Back to Login</ThemedText>
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
          <Pressable style={styles.backArrow} onPress={handleBackToLogin}>
            <Feather name="arrow-left" size={24} color={AppColors.white} />
          </Pressable>
          <View style={styles.iconWrapper}>
            <Feather name="key" size={32} color={AppColors.orangePrimary} />
          </View>
          <ThemedText type="h2" style={styles.headerTitle}>Forgot Password?</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            No worries, we'll send you reset instructions
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
          {error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={16} color="#E53935" />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email Address</ThemedText>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={20} color={AppColors.secondaryText} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email address"
                placeholderTextColor={AppColors.tertiaryText}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                testID="input-email"
              />
            </View>
            <ThemedText style={styles.helpText}>
              Enter the email address associated with your account
            </ThemedText>
          </View>
        </View>

        <Pressable
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={AppColors.white} />
          ) : (
            <ThemedText style={styles.submitButtonText}>Send Reset Link</ThemedText>
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
  headerGradient: {
    paddingBottom: Spacing["3xl"],
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  backArrow: {
    position: "absolute",
    left: Spacing.lg,
    top: Spacing.xl,
    padding: Spacing.sm,
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
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    color: AppColors.primaryText,
    fontWeight: "600",
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: AppColors.neutral,
    paddingHorizontal: Spacing.lg,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.lg,
    fontSize: 15,
    color: AppColors.primaryText,
  },
  helpText: {
    color: AppColors.secondaryText,
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  submitButton: {
    backgroundColor: AppColors.orangePrimary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.7,
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
    marginBottom: Spacing.md,
  },
  successNote: {
    color: AppColors.tertiaryText,
    textAlign: "center",
    fontSize: 13,
    fontStyle: "italic",
  },
});
