import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Switch,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius, AppColors, Shadows } from "@/constants/theme";

interface NotificationOption {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
}

const NOTIFICATION_OPTIONS: NotificationOption[] = [
  {
    id: "newPostScheduled",
    title: "New Post Scheduled",
    description: "Get notified when a new post has been scheduled for your account",
    icon: "calendar",
  },
  {
    id: "newIdeaUploaded",
    title: "New Idea Uploaded",
    description: "Get notified when a new content idea has been added for you",
    icon: "zap",
  },
  {
    id: "approvalReminders",
    title: "Approval Reminder Emails",
    description: "Receive a reminder email 72 hours before a post is scheduled if you haven't approved it yet. Note: posts are always auto-approved 48 hours before their scheduled time regardless of this setting.",
    icon: "clock",
  },
];

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [settings, setSettings] = useState<Record<string, boolean>>({
    newPostScheduled: true,
    newIdeaUploaded: true,
    approvalReminders: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.id) return;
      try {
        const url = new URL(`/api/clients/${user.id}/notification-settings`, getApiUrl());
        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          setSettings({
            newPostScheduled: true,
            newIdeaUploaded: true,
            approvalReminders: data.approvalRemindersEnabled === "true",
          });
        }
      } catch (error) {
        console.log("Error fetching notification settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [user?.id]);

  const handleToggle = async (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const newValue = !settings[id];
    setSettings(prev => ({
      ...prev,
      [id]: newValue,
    }));

    if (id === "approvalReminders" && user?.id) {
      try {
        await apiRequest("PATCH", `/api/clients/${user.id}/notification-settings`, {
          approvalRemindersEnabled: newValue ? "true" : "false",
        });
      } catch (error) {
        console.log("Error saving notification settings:", error);
        setSettings(prev => ({
          ...prev,
          [id]: !newValue,
        }));
      }
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={AppColors.orangePrimary} />
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <Animated.View 
        entering={FadeInDown.duration(400)}
        style={[styles.infoCard, Shadows.card]}
      >
        <View style={styles.infoIconContainer}>
          <Feather name="bell" size={20} color={AppColors.orangePrimary} />
        </View>
        <View style={styles.infoContent}>
          <ThemedText style={styles.infoTitle}>Email Notifications</ThemedText>
          <ThemedText style={styles.infoText}>
            Choose which notifications you'd like to receive
          </ThemedText>
        </View>
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(100).duration(400)}
        style={[styles.settingsCard, Shadows.card]}
      >
        {NOTIFICATION_OPTIONS.map((option, index) => (
          <View 
            key={option.id}
            style={[
              styles.settingRow,
              index < NOTIFICATION_OPTIONS.length - 1 && styles.settingRowBorder,
            ]}
          >
            <View style={styles.settingIconContainer}>
              <Feather name={option.icon} size={20} color={AppColors.orangePrimary} />
            </View>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingTitle}>{option.title}</ThemedText>
              <ThemedText style={styles.settingDescription}>{option.description}</ThemedText>
            </View>
            <Switch
              value={settings[option.id]}
              onValueChange={() => handleToggle(option.id)}
              trackColor={{ false: AppColors.neutral, true: AppColors.orangeLight }}
              thumbColor={settings[option.id] ? AppColors.orangePrimary : AppColors.white}
            />
          </View>
        ))}
      </Animated.View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.primaryText,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: AppColors.secondaryText,
  },
  settingsCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.primaryText,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: AppColors.secondaryText,
    lineHeight: 18,
  },
});
