import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors, Shadows } from "@/constants/theme";

export default function PrivacySecurityScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(400)} style={[styles.card, Shadows.card]}>
        <ThemedText style={styles.title}>Blossom and Bloom Marketing</ThemedText>
        <ThemedText style={styles.subtitle}>Privacy & Security Policy</ThemedText>
        <ThemedText style={styles.effectiveDate}>Effective date: February 2026</ThemedText>
        
        <ThemedText style={styles.paragraph}>
          Blossom and Bloom Marketing is a private, business-only app for users aged 18 and over. We respect your privacy and collect only what is necessary to operate the app.
        </ThemedText>

        <ThemedText style={styles.sectionHeader}>What Information We Collect</ThemedText>
        <ThemedText style={styles.paragraph}>We collect:</ThemedText>
        <View style={styles.bulletList}>
          <ThemedText style={styles.bulletItem}>Name</ThemedText>
          <ThemedText style={styles.bulletItem}>Email address</ThemedText>
          <ThemedText style={styles.bulletItem}>Business name</ThemedText>
          <ThemedText style={styles.bulletItem}>Optional phone number</ThemedText>
          <ThemedText style={styles.bulletItem}>Optional profile photo</ThemedText>
          <ThemedText style={styles.bulletItem}>Account login credentials (stored securely)</ThemedText>
        </View>
        <ThemedText style={styles.paragraph}>
          We do not collect location data, analytics, tracking data, advertising identifiers, or sensitive personal data.
        </ThemedText>

        <ThemedText style={styles.sectionHeader}>How We Use Your Information</ThemedText>
        <ThemedText style={styles.paragraph}>Your information is used only to:</ThemedText>
        <View style={styles.bulletList}>
          <ThemedText style={styles.bulletItem}>Create and manage your account</ThemedText>
          <ThemedText style={styles.bulletItem}>Provide app functionality</ThemedText>
          <ThemedText style={styles.bulletItem}>Send essential, transactional communications</ThemedText>
          <ThemedText style={styles.bulletItem}>Provide customer support</ThemedText>
          <ThemedText style={styles.bulletItem}>Maintain app security</ThemedText>
        </View>
        <ThemedText style={styles.paragraph}>
          We do not use your data for advertising or marketing.
        </ThemedText>

        <ThemedText style={styles.sectionHeader}>Authentication & Face ID</ThemedText>
        <ThemedText style={styles.paragraph}>You may choose to use Face ID to log in.</ThemedText>
        <ThemedText style={styles.paragraph}>Face ID is handled entirely by your device.</ThemedText>
        <ThemedText style={styles.paragraph}>We do not collect or store biometric data.</ThemedText>

        <ThemedText style={styles.sectionHeader}>Data Sharing</ThemedText>
        <ThemedText style={styles.paragraph}>
          We do not sell, rent, or share your personal data with third parties.
        </ThemedText>

        <ThemedText style={styles.sectionHeader}>Data Storage & Security</ThemedText>
        <ThemedText style={styles.paragraph}>
          Your data is stored on secure cloud servers and protected using:
        </ThemedText>
        <View style={styles.bulletList}>
          <ThemedText style={styles.bulletItem}>Encryption in transit (HTTPS)</ThemedText>
          <ThemedText style={styles.bulletItem}>Access controls</ThemedText>
          <ThemedText style={styles.bulletItem}>Regular security updates</ThemedText>
        </View>
        <ThemedText style={styles.paragraph}>
          Only the app owner can access user data.
        </ThemedText>

        <ThemedText style={styles.sectionHeader}>Emails</ThemedText>
        <ThemedText style={styles.paragraph}>
          We send transactional emails only, such as account or service notifications.
        </ThemedText>

        <ThemedText style={styles.sectionHeader}>Your Rights</ThemedText>
        <ThemedText style={styles.paragraph}>
          Under UK GDPR, you may request access to or deletion of your data at any time.
        </ThemedText>
        <ThemedText style={styles.contactEmail}>kate@blossomandbloommarketing.com</ThemedText>

        <ThemedText style={styles.sectionHeader}>Children</ThemedText>
        <ThemedText style={styles.paragraph}>
          This app is not intended for children and is available only to users aged 18 and over.
        </ThemedText>

        <ThemedText style={styles.sectionHeader}>Updates</ThemedText>
        <ThemedText style={styles.paragraph}>
          This policy may be updated from time to time. The latest version will always be available in the app.
        </ThemedText>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: AppColors.orangePrimary,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.primaryText,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  effectiveDate: {
    fontSize: 13,
    color: AppColors.secondaryText,
    textAlign: "center",
    marginBottom: Spacing.xl,
    fontStyle: "italic",
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.primaryText,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: AppColors.secondaryText,
    marginBottom: Spacing.sm,
  },
  bulletList: {
    marginLeft: Spacing.md,
    marginBottom: Spacing.sm,
  },
  bulletItem: {
    fontSize: 14,
    lineHeight: 24,
    color: AppColors.secondaryText,
    paddingLeft: Spacing.sm,
  },
  contactEmail: {
    fontSize: 14,
    color: AppColors.orangePrimary,
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
});
