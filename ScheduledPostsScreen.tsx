import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { AppColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

interface Upload {
  id: string;
  clientId: string;
  type: string;
  uri: string;
  thumbnail: string | null;
  caption: string | null;
  clientNotes: string | null;
  status: string;
  scheduledFor: string | null;
  uploadedAt: string;
  hashtags: string | null;
  platform: string | null;
  approvalStatus: string | null;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface ClientUploads {
  client: Client;
  uploads: Upload[];
}

function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { start: monday, end: sunday };
}

interface ScheduledPost {
  id: string;
  clientName: string;
  title: string;
  platform: "instagram" | "facebook" | "tiktok";
  scheduledTime: string;
  approvedDate: string;
}

const PLATFORM_COLORS = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  tiktok: "#000000",
};

const PLATFORM_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  instagram: "instagram",
  facebook: "facebook",
  tiktok: "video",
};

const TODAYS_POSTS: ScheduledPost[] = [
  { id: "1", clientName: "Sarah's Bakery", title: "New Spring Menu Launch", platform: "instagram", scheduledTime: "9:00 AM", approvedDate: "Jan 28, 2026" },
  { id: "2", clientName: "Mike's Fitness", title: "Monday Motivation Post", platform: "facebook", scheduledTime: "10:30 AM", approvedDate: "Jan 27, 2026" },
  { id: "3", clientName: "Green Garden Co", title: "Plant Care Tip #12", platform: "tiktok", scheduledTime: "12:00 PM", approvedDate: "Jan 29, 2026" },
  { id: "4", clientName: "Bella Boutique", title: "Flash Sale Announcement", platform: "instagram", scheduledTime: "2:00 PM", approvedDate: "Jan 30, 2026" },
  { id: "5", clientName: "Urban Cafe", title: "Happy Hour Special", platform: "facebook", scheduledTime: "4:00 PM", approvedDate: "Jan 26, 2026" },
];

function PostCard({ post, index }: { post: ScheduledPost; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <View style={[styles.postCard, Shadows.card]}>
        <View style={styles.timeColumn}>
          <ThemedText style={styles.timeText}>{post.scheduledTime}</ThemedText>
        </View>
        
        <View style={styles.contentColumn}>
          <View style={styles.cardHeader}>
            <View style={styles.clientBadge}>
              <ThemedText style={styles.clientBadgeText}>{post.clientName}</ThemedText>
            </View>
            <View style={[styles.platformBadge, { backgroundColor: PLATFORM_COLORS[post.platform] }]}>
              <Feather name={PLATFORM_ICONS[post.platform]} size={12} color={AppColors.white} />
              <ThemedText style={styles.platformText}>
                {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
              </ThemedText>
            </View>
          </View>

          <ThemedText type="h4" style={styles.postTitle}>{post.title}</ThemedText>
          
          <View style={styles.approvedRow}>
            <Feather name="check-circle" size={14} color="#4CAF50" />
            <ThemedText style={styles.approvedText}>Approved: {post.approvedDate}</ThemedText>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ScheduledPostsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch all uploads
  const { data: clientUploads = [], refetch } = useQuery<ClientUploads[]>({
    queryKey: ["/api/uploads"],
  });

  // Get week bounds for navigation limits
  const weekBounds = useMemo(() => getWeekBounds(selectedDate), [selectedDate]);
  
  // Check if we can navigate
  const canGoPrev = selectedDate > weekBounds.start;
  const canGoNext = selectedDate < weekBounds.end;
  
  // Filter posts for selected date
  const postsForDate = useMemo(() => {
    const selectedDateStr = selectedDate.toDateString();
    const posts: ScheduledPost[] = [];
    
    clientUploads.forEach(cu => {
      cu.uploads
        .filter(u => u.status === "scheduled" && u.scheduledFor)
        .forEach(u => {
          const uploadDate = new Date(u.scheduledFor!);
          if (uploadDate.toDateString() === selectedDateStr) {
            posts.push({
              id: u.id,
              clientName: cu.client.name,
              title: u.caption || "Scheduled Post",
              platform: (u.platform || "instagram") as "instagram" | "facebook" | "tiktok",
              scheduledTime: uploadDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
              approvedDate: u.approvalStatus === "approved" ? "Approved" : "Pending",
            });
          }
        });
    });
    
    return posts.sort((a, b) => {
      const timeA = new Date(`2000-01-01 ${a.scheduledTime}`).getTime();
      const timeB = new Date(`2000-01-01 ${b.scheduledTime}`).getTime();
      return timeA - timeB;
    });
  }, [clientUploads, selectedDate]);

  const handlePrevDay = () => {
    if (canGoPrev) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() - 1);
      setSelectedDate(newDate);
    }
  };

  const handleNextDay = () => {
    if (canGoNext) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() + 1);
      setSelectedDate(newDate);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const formattedDate = selectedDate.toLocaleDateString("en-US", { 
    weekday: "long", 
    month: "long", 
    day: "numeric", 
    year: "numeric" 
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[AppColors.orangePrimary]}
            tintColor={AppColors.orangePrimary}
          />
        }
      >
        <View style={[styles.dateHeader, Shadows.card]}>
          <Pressable 
            onPress={handlePrevDay}
            style={[styles.navButton, !canGoPrev && styles.navButtonDisabled]}
            disabled={!canGoPrev}
          >
            <Feather name="chevron-left" size={24} color={canGoPrev ? AppColors.orangePrimary : AppColors.neutral} />
          </Pressable>
          
          <View style={styles.dateCenter}>
            <ThemedText style={styles.todayLabel}>{isToday ? "Today" : selectedDate.toLocaleDateString("en-US", { weekday: "long" })}</ThemedText>
            <ThemedText type="h4" style={styles.dateText}>
              {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </ThemedText>
          </View>
          
          <Pressable 
            onPress={handleNextDay}
            style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
            disabled={!canGoNext}
          >
            <Feather name="chevron-right" size={24} color={canGoNext ? AppColors.orangePrimary : AppColors.neutral} />
          </Pressable>
        </View>

        <View style={styles.countRow}>
          <ThemedText style={styles.sectionLabel}>Scheduled Posts</ThemedText>
          <View style={styles.countBadge}>
            <ThemedText style={styles.countText}>{postsForDate.length} post{postsForDate.length !== 1 ? "s" : ""}</ThemedText>
          </View>
        </View>

        {postsForDate.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} />
        ))}

        {postsForDate.length === 0 ? (
          <View style={[styles.emptyState, Shadows.card]}>
            <Feather name="calendar" size={48} color={AppColors.tertiaryText} />
            <ThemedText type="h4" style={styles.emptyTitle}>No posts scheduled</ThemedText>
            <ThemedText style={styles.emptyText}>There are no posts scheduled for this day</ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateHeader: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  dateCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },
  todayLabel: {
    color: AppColors.orangePrimary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  dateText: {
    color: AppColors.primaryText,
    textAlign: "center",
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  countBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  countText: {
    color: "#4CAF50",
    fontWeight: "600",
    fontSize: 13,
  },
  sectionLabel: {
    color: AppColors.secondaryText,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  postCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: "row",
  },
  timeColumn: {
    width: 70,
    paddingRight: Spacing.md,
    borderRightWidth: 2,
    borderRightColor: "#4CAF50",
    marginRight: Spacing.md,
    justifyContent: "center",
  },
  timeText: {
    color: "#4CAF50",
    fontWeight: "700",
    fontSize: 14,
  },
  contentColumn: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  clientBadge: {
    backgroundColor: AppColors.softCream,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  clientBadgeText: {
    color: AppColors.orangePrimary,
    fontSize: 11,
    fontWeight: "600",
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  platformText: {
    color: AppColors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  postTitle: {
    color: AppColors.primaryText,
    marginBottom: Spacing.sm,
    fontSize: 15,
  },
  approvedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  approvedText: {
    color: AppColors.secondaryText,
    fontSize: 12,
  },
  emptyState: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing["3xl"],
    alignItems: "center",
  },
  emptyTitle: {
    color: AppColors.primaryText,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    color: AppColors.secondaryText,
    textAlign: "center",
  },
});
