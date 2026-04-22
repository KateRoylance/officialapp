import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, AppColors, Shadows } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PrivacyConsentScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { acceptPrivacy } = useAuth();
  
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const buttonScale = useSharedValue(1);
  const checkboxScale = useSharedValue(1);

  const handleToggleCheckbox = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    checkboxScale.value = withSpring(0.9, {}, () => {
      checkboxScale.value = withSpring(1);
    });
    setIsChecked(!isChecked);
    setError("");
  };

  const handleContinue = async () => {
    if (!isChecked) {
      setError("Please confirm you have read and understood our privacy policy");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setIsLoading(true);
    setError("");

    const success = await acceptPrivacy();
    
    if (success) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      setError("Something went wrong. Please try again.");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
    
    setIsLoading(false);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const checkboxAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkboxScale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View style={styles.iconContainer}>
            <Feather name="shield" size={40} color={AppColors.orangePrimary} />
          </View>
          <ThemedText style={styles.title}>Privacy & Security</ThemedText>
          <ThemedText style={styles.subtitle}>
            Before you continue, please review our privacy policy
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[styles.card, Shadows.card]}>
          <ThemedText style={styles.cardTitle}>Blossom and Bloom Marketing</ThemedText>
          <ThemedText style={styles.cardSubtitle}>Privacy & Security Policy</ThemedText>
          
          <View style={styles.summarySection}>
            <View style={styles.summaryItem}>
              <Feather name="check-circle" size={18} color={AppColors.success} />
              <ThemedText style={styles.summaryText}>We only collect essential information</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <Feather name="check-circle" size={18} color={AppColors.success} />
              <ThemedText style={styles.summaryText}>No tracking, analytics, or advertising</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <Feather name="check-circle" size={18} color={AppColors.success} />
              <ThemedText style={styles.summaryText}>Your data is never sold or shared</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <Feather name="check-circle" size={18} color={AppColors.success} />
              <ThemedText style={styles.summaryText}>Face ID is handled by your device only</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <Feather name="check-circle" size={18} color={AppColors.success} />
              <ThemedText style={styles.summaryText}>Secure cloud storage with encryption</ThemedText>
            </View>
          </View>

          <ThemedText style={styles.viewFullPolicy}>
            You can view the full policy anytime in Profile {">"} Privacy & Security
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.consentSection}>
          <Pressable onPress={handleToggleCheckbox} style={styles.checkboxRow}>
            <Animated.View style={[styles.checkbox, isChecked && styles.checkboxChecked, checkboxAnimatedStyle]}>
              {isChecked ? (
                <Feather name="check" size={16} color={AppColors.white} />
              ) : null}
            </Animated.View>
            <ThemedText style={styles.checkboxLabel}>
              By ticking, you confirm you have read and understood our privacy and security policy
            </ThemedText>
          </Pressable>

          {error ? (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.buttonContainer}>
          <AnimatedPressable
            onPress={handleContinue}
            onPressIn={() => { buttonScale.value = withSpring(0.98); }}
            onPressOut={() => { buttonScale.value = withSpring(1); }}
            style={[styles.continueButton, !isChecked && styles.continueButtonDisabled, buttonAnimatedStyle]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={AppColors.white} />
            ) : (
              <ThemedText style={styles.continueButtonText}>Continue to App</ThemedText>
            )}
          </AnimatedPressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: AppColors.primaryText,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: AppColors.secondaryText,
    textAlign: "center",
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.orangePrimary,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: 14,
    color: AppColors.secondaryText,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  summarySection: {
    gap: Spacing.md,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  summaryText: {
    fontSize: 14,
    color: AppColors.primaryText,
    flex: 1,
  },
  viewFullPolicy: {
    fontSize: 12,
    color: AppColors.tertiaryText,
    textAlign: "center",
    marginTop: Spacing.xl,
    fontStyle: "italic",
  },
  consentSection: {
    marginBottom: Spacing.xl,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: AppColors.neutral,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: AppColors.orangePrimary,
    borderColor: AppColors.orangePrimary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: AppColors.primaryText,
    lineHeight: 22,
  },
  errorText: {
    color: AppColors.error,
    fontSize: 13,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: "auto",
  },
  continueButton: {
    backgroundColor: AppColors.orangePrimary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
