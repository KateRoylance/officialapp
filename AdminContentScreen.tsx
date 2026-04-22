import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
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
  hashtags: string | null;
  platform: string | null;
  clientNotes: string | null;
  status: string;
  approvalStatus: string | null;
  scheduledFor: string | null;
  scheduledAt: string | null;
  uploadedAt: string;
}

const APPROVAL_CONFIG: Record<string, { color: string; label: string; bg: string; icon: string }> = {
  pending: { color: "#F57C00", label: "Pending Approval", bg: "#FFF3E0", icon: "clock" },
  approved: { color: "#2E7D32", label: "Approved", bg: "#E8F5E9", icon: "check-circle" },
};

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "instagram",
  facebook: "facebook",
  tiktok: "video",
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  tiktok: "#000000",
};

interface ClientUploads {
  client: {
    id: string;
    name: string;
    avatar: string;
  };
  uploads: Upload[];
}

const STATUS_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  new: { color: AppColors.orangePrimary, label: "New", bg: "#FFF5ED" },
  scheduled: { color: "#2196F3", label: "Scheduled", bg: "#E3F2FD" },
};

function ContentCard({ item, clientName, index }: { item: Upload; clientName: string; index: number }) {
  const platformColor = item.platform ? PLATFORM_COLORS[item.platform] || AppColors.secondaryText : AppColors.secondaryText;
  const approvalConfig = APPROVAL_CONFIG[item.approvalStatus || "pending"] || APPROVAL_CONFIG.pending;
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const getPlatformLabel = (platform: string | null) => {
    if (!platform) return null;
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  };
  
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <View style={[styles.contentCard, Shadows.card]}>
        <View style={styles.cardHeader}>
          <View style={styles.clientBadge}>
            <ThemedText style={styles.clientBadgeText}>{clientName}</ThemedText>
          </View>
          {item.platform ? (
            <View style={[styles.platformBadge, { backgroundColor: platformColor }]}>
              <Feather 
                name={PLATFORM_ICONS[item.platform] as any || "share-2"} 
                size={12} 
                color={AppColors.white} 
              />
              <ThemedText style={styles.platformBadgeText}>
                {getPlatformLabel(item.platform)}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.contentRow}>
          <Image source={{ uri: item.thumbnail || item.uri }} style={styles.thumbnail} />
          <View style={styles.contentInfo}>
            {item.caption ? (
              <ThemedText type="h4" style={styles.contentTitle} numberOfLines={2}>
                {item.caption}
              </ThemedText>
            ) : (
              <ThemedText style={styles.noCaption}>No caption</ThemedText>
            )}
            <View style={styles.typeTag}>
              <Feather 
                name={item.type === "video" ? "video" : "image"} 
                size={12} 
                color={AppColors.secondaryText} 
              />
              <ThemedText style={styles.typeText}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </ThemedText>
            </View>
          </View>
        </View>

        {item.hashtags ? (
          <View style={styles.hashtagsContainer}>
            <ThemedText style={styles.hashtagsText}>{item.hashtags}</ThemedText>
          </View>
        ) : null}

        {item.clientNotes ? (
          <View style={styles.notesContainer}>
            <Feather name="message-square" size={14} color={AppColors.orangePrimary} />
            <ThemedText style={styles.notesText} numberOfLines={2}>{item.clientNotes}</ThemedText>
          </View>
        ) : null}

        <View style={styles.approvalSection}>
          <View style={[styles.approvalBadge, { backgroundColor: approvalConfig.bg }]}>
            <Feather name={approvalConfig.icon as any} size={14} color={approvalConfig.color} />
            <ThemedText style={[styles.approvalText, { color: approvalConfig.color }]}>
              {approvalConfig.label}
            </ThemedText>
          </View>
          <ThemedText style={styles.approvalHint}>
            {item.approvalStatus === "approved" ? "Client approved" : "Awaiting client approval"}
          </ThemedText>
        </View>

        <View style={styles.cardFooter}>
          {item.scheduledFor ? (
            <View style={styles.scheduleInfo}>
              <View style={styles.dateContainer}>
                <Feather name="calendar" size={14} color="#1565C0" />
                <ThemedText style={styles.scheduleDateText}>
                  {formatDate(item.scheduledFor)}
                </ThemedText>
              </View>
              <View style={styles.dateContainer}>
                <Feather name="clock" size={14} color="#1565C0" />
                <ThemedText style={styles.scheduleDateText}>
                  {formatTime(item.scheduledFor)}
                </ThemedText>
              </View>
            </View>
          ) : (
            <View style={styles.dateContainer}>
              <Feather name="clock" size={14} color={AppColors.secondaryText} />
              <ThemedText style={styles.dateText}>
                Uploaded: {formatDate(item.uploadedAt)}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export default function AdminContentScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const { data: clientUploads = [], isLoading, refetch } = useQuery<ClientUploads[]>({
    queryKey: ["/api/uploads"],
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const scheduledContent = clientUploads.flatMap(cu => 
    cu.uploads
      .filter(u => u.status === "scheduled")
      .map(u => ({ ...u, clientName: cu.client.name }))
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={scheduledContent}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <ContentCard item={item} clientName={item.clientName} index={index} />
        )}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={AppColors.orangePrimary}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <View style={styles.summaryCard}>
              <Feather name="calendar" size={24} color={AppColors.orangePrimary} style={{ marginBottom: Spacing.sm }} />
              <ThemedText type="h3" style={styles.summaryTitle}>Scheduled Posts</ThemedText>
              <ThemedText style={styles.summarySubtitle}>
                {scheduledContent.length > 0 
                  ? `${scheduledContent.length} post${scheduledContent.length === 1 ? "" : "s"} scheduled for publishing`
                  : "No posts scheduled yet"}
              </ThemedText>
            </View>
          </View>
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Feather name="calendar" size={48} color={AppColors.tertiaryText} />
            </View>
            <ThemedText type="h4" style={styles.emptyTitle}>No Scheduled Posts</ThemedText>
            <ThemedText style={styles.emptyText}>
              Schedule posts from the Uploads section and they will appear here
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  summaryTitle: {
    color: AppColors.primaryText,
    marginBottom: Spacing.xs,
  },
  summarySubtitle: {
    color: AppColors.secondaryText,
    fontSize: 14,
  },
  contentCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  clientBadge: {
    backgroundColor: AppColors.softCream,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  clientBadgeText: {
    color: AppColors.orangePrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  contentRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    backgroundColor: AppColors.neutral,
  },
  contentInfo: {
    flex: 1,
    justifyContent: "center",
  },
  contentTitle: {
    color: AppColors.primaryText,
    marginBottom: Spacing.sm,
  },
  typeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  typeText: {
    fontSize: 12,
    color: AppColors.secondaryText,
  },
  notesContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: AppColors.softCream,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.orangePrimary,
  },
  notesText: {
    flex: 1,
    color: AppColors.secondaryText,
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppColors.neutral,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  dateText: {
    color: AppColors.secondaryText,
    fontSize: 13,
  },
  scheduleDateText: {
    color: "#1565C0",
    fontSize: 13,
    fontWeight: "600",
  },
  scheduleInfo: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  platformBadgeText: {
    color: AppColors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  hashtagsContainer: {
    marginBottom: Spacing.md,
  },
  hashtagsText: {
    color: "#1565C0",
    fontSize: 13,
  },
  noCaption: {
    color: AppColors.tertiaryText,
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: Spacing.sm,
  },
  approvalSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppColors.neutral,
  },
  approvalBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  approvalText: {
    fontSize: 12,
    fontWeight: "600",
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E7D32",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  approveButtonText: {
    color: AppColors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  approvalHint: {
    color: AppColors.tertiaryText,
    fontSize: 12,
    fontStyle: "italic",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.neutral,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    color: AppColors.primaryText,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    color: AppColors.tertiaryText,
    textAlign: "center",
    lineHeight: 20,
  },
});
