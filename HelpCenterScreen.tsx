import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors, Shadows } from "@/constants/theme";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "How do I upload content?",
    answer: "Go to the Upload tab at the bottom of the screen, tap the upload button, and select photos or videos from your gallery. You can add notes for Kate to help her understand what you'd like.",
  },
  {
    question: "How long does it take for my content to be scheduled?",
    answer: "Kate typically reviews and schedules your content within 24-48 hours. You'll see scheduled posts appear in your Calendar tab once they're ready for your approval.",
  },
  {
    question: "How do I approve a scheduled post?",
    answer: "Go to your Calendar tab, tap on a day with scheduled posts, then tap on the post to view details. You can approve or request changes from there.",
  },
  {
    question: "Can I change my profile information?",
    answer: "You can update your profile photo directly in the Edit Profile section. For other changes like your business name or email, please contact Kate directly.",
  },
  {
    question: "What happens after I approve a post?",
    answer: "Once approved, Kate will publish your content at the scheduled time to your connected social media platforms. You don't need to do anything else!",
  },
  {
    question: "How do I connect my social media accounts?",
    answer: "Social media account connections are managed by Kate to ensure security. Contact her to add or update your connected platforms.",
  },
  {
    question: "Can I reject a scheduled post?",
    answer: "Yes! When viewing a scheduled post, you can choose to reject it and provide feedback. Kate will review your comments and make adjustments.",
  },
  {
    question: "How do I enable Face ID login?",
    answer: "When logging in, enable the 'Remember Me' toggle. On your next login, you'll be able to use Face ID or Touch ID if your device supports it.",
  },
];

function FAQItemCard({ item, index }: { item: FAQItem; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsExpanded(!isExpanded);
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        <Animated.View style={[styles.faqCard, Shadows.card, cardStyle]}>
          <View style={styles.faqHeader}>
            <ThemedText style={styles.faqQuestion}>{item.question}</ThemedText>
            <Feather 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={AppColors.orangePrimary} 
            />
          </View>
          {isExpanded ? (
            <ThemedText style={styles.faqAnswer}>{item.answer}</ThemedText>
          ) : null}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function HelpCenterScreen() {
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
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <ThemedText style={styles.title}>Frequently Asked Questions</ThemedText>
        <ThemedText style={styles.subtitle}>
          Find answers to common questions about using the app
        </ThemedText>
      </Animated.View>

      <View style={styles.faqList}>
        {FAQ_DATA.map((item, index) => (
          <FAQItemCard key={index} item={item} index={index} />
        ))}
      </View>

      <Animated.View entering={FadeInDown.delay(400).duration(300)} style={[styles.contactCard, Shadows.card]}>
        <View style={styles.contactIconContainer}>
          <Feather name="message-circle" size={28} color={AppColors.orangePrimary} />
        </View>
        <ThemedText style={styles.contactTitle}>Still need help?</ThemedText>
        <ThemedText style={styles.contactText}>
          If you couldn't find the answer you were looking for, get in touch with Kate directly.
        </ThemedText>

        <View style={styles.contactMethods}>
          <Pressable onPress={handleEmail} style={styles.contactMethod}>
            <View style={styles.contactMethodIcon}>
              <Feather name="mail" size={18} color={AppColors.orangePrimary} />
            </View>
            <View style={styles.contactMethodInfo}>
              <ThemedText style={styles.contactMethodLabel}>Email</ThemedText>
              <ThemedText style={styles.contactMethodValue}>kate@blossomandbloommarketing.com</ThemedText>
            </View>
          </Pressable>

          <Pressable onPress={handlePhone} style={styles.contactMethod}>
            <View style={styles.contactMethodIcon}>
              <Feather name="phone" size={18} color={AppColors.orangePrimary} />
            </View>
            <View style={styles.contactMethodInfo}>
              <ThemedText style={styles.contactMethodLabel}>Phone</ThemedText>
              <ThemedText style={styles.contactMethodValue}>01752 374533</ThemedText>
            </View>
          </Pressable>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: AppColors.primaryText,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.secondaryText,
    lineHeight: 20,
  },
  faqList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  faqCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.primaryText,
    lineHeight: 22,
  },
  faqAnswer: {
    fontSize: 14,
    color: AppColors.secondaryText,
    lineHeight: 22,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppColors.neutral,
  },
  contactCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
  },
  contactIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.primaryText,
    marginBottom: Spacing.sm,
  },
  contactText: {
    fontSize: 14,
    color: AppColors.secondaryText,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  contactMethods: {
    width: "100%",
    gap: Spacing.md,
  },
  contactMethod: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.softCream,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  contactMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  contactMethodInfo: {
    flex: 1,
  },
  contactMethodLabel: {
    fontSize: 12,
    color: AppColors.secondaryText,
    marginBottom: 2,
  },
  contactMethodValue: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primaryText,
  },
});
