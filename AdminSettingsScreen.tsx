import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { AppColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { AdminStackParamList } from "@/navigation/types";

interface AdminProfile {
  id: string;
  email: string;
  mobile: string | null;
  updatedAt: string;
}

interface SettingItem {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  action?: () => void;
  danger?: boolean;
}

export default function AdminSettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();

  const { data: profile } = useQuery<AdminProfile>({
    queryKey: ["/api/admin/profile"],
  });

  const settingsSections: { title: string; items: SettingItem[] }[] = [
    {
      title: "Account",
      items: [
        { id: "profile", icon: "user", title: "Admin Profile", subtitle: profile?.email },
        { id: "notifications", icon: "bell", title: "Notification Settings", action: () => navigation.navigate("NotificationSettings") },
        { id: "security", icon: "shield", title: "Security & Password" },
      ],
    },
    {
      title: "",
      items: [
        { id: "logout", icon: "log-out", title: "Sign Out", action: logout, danger: true },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.adminCard, Shadows.card]}>
          <View style={styles.adminAvatar}>
            <Feather name="shield" size={28} color={AppColors.orangePrimary} />
          </View>
          <View style={styles.adminInfo}>
            <ThemedText type="h4" style={styles.adminName}>Administrator</ThemedText>
            <View style={styles.contactRow}>
              <Feather name="mail" size={12} color={AppColors.secondaryText} />
              <ThemedText style={styles.adminEmail}>{profile?.email}</ThemedText>
            </View>
            <View style={styles.contactRow}>
              <Feather name="phone" size={12} color={AppColors.secondaryText} />
              <ThemedText style={styles.adminPhone}>
                {profile?.mobile || "Not set"}
              </ThemedText>
            </View>
          </View>
          <View style={styles.adminBadge}>
            <ThemedText style={styles.adminBadgeText}>Admin</ThemedText>
          </View>
        </View>

        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            {section.title ? (
              <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            ) : null}
            <View style={[styles.sectionCard, Shadows.card]}>
              {section.items.map((item, itemIndex) => (
                <Pressable
                  key={item.id}
                  onPress={item.action}
                  style={[
                    styles.settingItem,
                    itemIndex < section.items.length - 1 && styles.settingItemBorder,
                  ]}
                >
                  <View style={[styles.settingIcon, item.danger && styles.settingIconDanger]}>
                    <Feather
                      name={item.icon}
                      size={20}
                      color={item.danger ? AppColors.error : AppColors.orangePrimary}
                    />
                  </View>
                  <View style={styles.settingContent}>
                    <ThemedText
                      style={[styles.settingTitle, item.danger && styles.settingTitleDanger]}
                    >
                      {item.title}
                    </ThemedText>
                    {item.subtitle ? (
                      <ThemedText style={styles.settingSubtitle}>{item.subtitle}</ThemedText>
                    ) : null}
                  </View>
                  {!item.danger ? (
                    <Feather name="chevron-right" size={20} color={AppColors.tertiaryText} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  adminCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  adminAvatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    color: AppColors.primaryText,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 2,
  },
  adminEmail: {
    color: AppColors.secondaryText,
    fontSize: 12,
  },
  adminPhone: {
    color: AppColors.secondaryText,
    fontSize: 12,
  },
  adminBadge: {
    backgroundColor: AppColors.orangePrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  adminBadgeText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    color: AppColors.secondaryText,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
  },
  sectionCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingIconDanger: {
    backgroundColor: "#FFEBEE",
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: AppColors.primaryText,
    fontSize: 15,
    fontWeight: "500",
  },
  settingTitleDanger: {
    color: AppColors.error,
  },
  settingSubtitle: {
    color: AppColors.secondaryText,
    fontSize: 13,
    marginTop: 2,
  },
});
