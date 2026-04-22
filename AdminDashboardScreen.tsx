import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { AdminStackParamList, AdminTabParamList } from "@/navigation/types";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { AppColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

type StatRoute = "PendingApprovals" | "ScheduledPosts" | "ClientsTab" | null;

interface StatCard {
  id: string;
  title: string;
  value: number;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  route: StatRoute;
}

type ActivityType = "upload" | "message" | "approval" | "comment" | "none";

interface ClientActivity {
  id: string;
  name: string;
  pendingApprovals: number;
  lastActive: string;
  recentActivity: string;
}

interface DashboardStats {
  totalClients: number;
  pendingApprovals: number;
  todaysScheduledPosts: number;
  activeClients: number;
  clientActivity: ClientActivity[];
}

const ACTIVITY_CONFIG: Record<string, { color: string; icon: keyof typeof Feather.glyphMap; label: string }> = {
  upload: { color: "#4CAF50", icon: "upload", label: "New upload" },
  message: { color: "#2196F3", icon: "message-circle", label: "New message" },
  approval: { color: "#FFC107", icon: "check-circle", label: "Awaiting approval" },
  comment: { color: "#9C27B0", icon: "message-square", label: "New comment" },
  none: { color: AppColors.tertiaryText, icon: "minus", label: "No recent activity" },
};

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const tabNavigation = useNavigation<BottomTabNavigationProp<AdminTabParamList>>();

  const { data: stats, isLoading, refetch } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchOnMount: "always",
    refetchInterval: 30000,
  });

  const statCards: StatCard[] = [
    { id: "1", title: "Total Clients", value: stats?.totalClients ?? 0, icon: "users", color: AppColors.orangePrimary, route: "ClientsTab" },
    { id: "2", title: "Pending Approvals", value: stats?.pendingApprovals ?? 0, icon: "clock", color: "#FFC107", route: "PendingApprovals" },
    { id: "3", title: "Today's Scheduled", value: stats?.todaysScheduledPosts ?? 0, icon: "calendar", color: "#4CAF50", route: "ScheduledPosts" },
    { id: "4", title: "Active Clients", value: stats?.activeClients ?? 0, icon: "activity", color: "#2196F3", route: "ClientsTab" },
  ];

  const handleStatPress = (route: StatRoute) => {
    if (route === "ClientsTab") {
      tabNavigation.navigate("ClientsTab");
    } else if (route) {
      navigation.navigate(route);
    }
  };

  const handleClientPress = (client: ClientActivity) => {
    navigation.navigate("ClientDetail", {
      clientId: client.id,
      clientName: client.name,
    });
  };

  if (isLoading && !stats) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={AppColors.orangePrimary} />
      </View>
    );
  }

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
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={AppColors.orangePrimary}
          />
        }
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <LinearGradient
            colors={[AppColors.orangePrimary, AppColors.orangeLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeBanner}
          >
            <View>
              <ThemedText style={styles.welcomeLabel}>Welcome back</ThemedText>
              <ThemedText type="h2" style={styles.welcomeTitle}>Admin Dashboard</ThemedText>
            </View>
            <Feather name="bar-chart-2" size={48} color="rgba(255,255,255,0.3)" />
          </LinearGradient>
        </Animated.View>

        <View style={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <Animated.View 
              key={stat.id} 
              entering={FadeInDown.delay(100 + index * 50).duration(400)}
              style={styles.statCardWrapper}
            >
              <Pressable 
                style={[styles.statCard, Shadows.card]}
                onPress={() => handleStatPress(stat.route)}
              >
                <View style={[styles.statIconWrapper, { backgroundColor: stat.color + "15" }]}>
                  <Feather name={stat.icon} size={20} color={stat.color} />
                </View>
                <ThemedText type="h2" style={styles.statValue}>{stat.value}</ThemedText>
                <ThemedText style={styles.statTitle}>{stat.title}</ThemedText>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4" style={styles.sectionTitle}>Client Activity</ThemedText>
          </View>

          {stats?.clientActivity && stats.clientActivity.length > 0 ? (
            stats.clientActivity.map((client, index) => {
              const activityConfig = ACTIVITY_CONFIG[client.recentActivity] || ACTIVITY_CONFIG.none;
              
              return (
                <Pressable
                  key={client.id}
                  style={[styles.clientCard, Shadows.card]}
                  onPress={() => handleClientPress(client)}
                >
                  <View style={styles.clientHeader}>
                    <View style={styles.clientAvatar}>
                      <ThemedText style={styles.clientAvatarText}>
                        {client.name.charAt(0).toUpperCase()}
                      </ThemedText>
                    </View>
                    <View style={styles.clientInfo}>
                      <ThemedText style={styles.clientName}>{client.name}</ThemedText>
                      <View style={styles.activityRow}>
                        <Feather 
                          name={activityConfig.icon} 
                          size={12} 
                          color={activityConfig.color} 
                        />
                        <ThemedText style={[styles.activityLabel, { color: activityConfig.color }]}>
                          {activityConfig.label}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.clientMeta}>
                      <ThemedText style={styles.lastActive}>{client.lastActive}</ThemedText>
                      {client.pendingApprovals > 0 ? (
                        <View style={styles.badge}>
                          <ThemedText style={styles.badgeText}>{client.pendingApprovals}</ThemedText>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View style={[styles.emptyCard, Shadows.card]}>
              <Feather name="users" size={32} color={AppColors.tertiaryText} />
              <ThemedText style={styles.emptyText}>No active clients yet</ThemedText>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeBanner: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  welcomeLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  welcomeTitle: {
    color: AppColors.white,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -Spacing.xs,
    marginBottom: Spacing.lg,
  },
  statCardWrapper: {
    width: "50%",
    padding: Spacing.xs,
  },
  statCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
  },
  statIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    color: AppColors.primaryText,
    marginBottom: Spacing.xs,
  },
  statTitle: {
    color: AppColors.secondaryText,
    fontSize: 12,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: AppColors.primaryText,
  },
  clientCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  clientAvatarText: {
    color: AppColors.orangePrimary,
    fontSize: 18,
    fontWeight: "600",
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    color: AppColors.primaryText,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  activityLabel: {
    fontSize: 12,
  },
  clientMeta: {
    alignItems: "flex-end",
  },
  lastActive: {
    color: AppColors.tertiaryText,
    fontSize: 11,
    marginBottom: 4,
  },
  badge: {
    backgroundColor: AppColors.orangePrimary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: AppColors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyText: {
    color: AppColors.tertiaryText,
    fontSize: 14,
  },
});
