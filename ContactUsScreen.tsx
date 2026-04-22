import React from "react";
import { View, StyleSheet, Pressable, Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors, Shadows } from "@/constants/theme";

export default function ContactUsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const handleEmail = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await Linking.openURL("mailto:kate@blossomandbloommarketing.com");
    } catch (error) {
      console.log("Could not open email client");
    }
  };

  const handlePhone = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await Linking.openURL("tel:01752374533");
    } catch (error) {
      console.log("Could not open phone dialer");
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight + Spacing.xl }]}
    >
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <View style={styles.iconContainer}>
          <Feather name="message-circle" size={40} color={AppColors.orangePrimary} />
        </View>
        <ThemedText style={styles.title}>Get in Touch</ThemedText>
        <ThemedText style={styles.subtitle}>
          Have a question or need help? Reach out to Kate directly using the options below.
        </ThemedText>
      </Animated.View>

      <View style={styles.contactMethods}>
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Pressable onPress={handleEmail} style={[styles.contactCard, Shadows.card]}>
            <View style={styles.contactIconContainer}>
              <Feather name="mail" size={24} color={AppColors.orangePrimary} />
            </View>
            <View style={styles.contactInfo}>
              <ThemedText style={styles.contactLabel}>Email</ThemedText>
              <ThemedText style={styles.contactValue}>kate@blossomandbloommarketing.com</ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={AppColors.tertiaryText} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <Pressable onPress={handlePhone} style={[styles.contactCard, Shadows.card]}>
            <View style={styles.contactIconContainer}>
              <Feather name="phone" size={24} color={AppColors.orangePrimary} />
            </View>
            <View style={styles.contactInfo}>
              <ThemedText style={styles.contactLabel}>Phone</ThemedText>
              <ThemedText style={styles.contactValue}>01752 374533</ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={AppColors.tertiaryText} />
          </Pressable>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(300).duration(300)} style={[styles.hoursCard, Shadows.card]}>
        <View style={styles.hoursIconContainer}>
          <Feather name="clock" size={24} color={AppColors.orangePrimary} />
        </View>
        <View style={styles.hoursInfo}>
          <ThemedText style={styles.hoursLabel}>Business Hours</ThemedText>
          <ThemedText style={styles.hoursValue}>10am - 4pm</ThemedText>
          <ThemedText style={styles.hoursDays}>Monday to Saturday</ThemedText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
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
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  contactMethods: {
    gap: Spacing.md,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: AppColors.secondaryText,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.primaryText,
  },
  hoursCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  hoursIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  hoursInfo: {
    flex: 1,
  },
  hoursLabel: {
    fontSize: 12,
    color: AppColors.secondaryText,
    marginBottom: 2,
  },
  hoursValue: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.primaryText,
  },
  hoursDays: {
    fontSize: 13,
    color: AppColors.secondaryText,
    marginTop: 2,
  },
});
