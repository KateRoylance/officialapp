import React, { useState, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { AppColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { AdminStackParamList } from "@/navigation/types";
import { getApiUrl } from "@/lib/query-client";

type Props = NativeStackScreenProps<AdminStackParamList, "PendingApprovals">;

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
  approvalStatus: string;
  scheduledFor: string | null;
  scheduledAt: string | null;
  uploadedAt: string;
}

interface Client {
  id: string;
  businessName: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  tiktok: "#000000",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Not set";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", { 
    day: "numeric", 
    month: "short", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function PostCard({ upload, clientName, index }: { upload: Upload; clientName: string; index: number }) {
  const platform = upload.platform || "instagram";
  
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <View style={[styles.postCard, Shadows.card]}>
        <View style={styles.cardHeader}>
          <View style={styles.clientBadge}>
            <ThemedText style={styles.clientBadgeText}>{clientName}</ThemedText>
          </View>
          <View style={[styles.platformBadge, { backgroundColor: PLATFORM_COLORS[platform] || "#666" }]}>
            <ThemedText style={styles.platformText}>
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </ThemedText>
          </View>
        </View>

        {upload.thumbnail ? (
          <Image source={{ uri: upload.thumbnail }} style={styles.thumbnail} />
        ) : null}

        <ThemedText type="h4" style={styles.postTitle} numberOfLines={2}>
          {upload.caption || "No caption"}
        </ThemedText>
        
        <View style={styles.metaRow}>
          <Feather name="calendar" size={14} color={AppColors.secondaryText} />
          <ThemedText style={styles.metaText}>Scheduled: {formatDate(upload.scheduledFor)}</ThemedText>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, styles.statusPending]}>
            <Feather name="clock" size={14} color="#FFC107" />
            <ThemedText style={[styles.statusText, { color: "#FFC107" }]}>
              Awaiting Client Approval
            </ThemedText>
          </View>
        </View>

        {upload.clientNotes ? (
          <View style={styles.notesContainer}>
            <View style={styles.notesHeader}>
              <Feather name="message-circle" size={14} color={AppColors.secondaryText} />
              <ThemedText style={styles.notesLabel}>Client Notes:</ThemedText>
            </View>
            <ThemedText style={styles.notesText}>{upload.clientNotes}</ThemedText>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

export default function PendingApprovalsScreen({ route, navigation }: Props) {
  const clientId = route.params?.clientId;
  const clientName = route.params?.clientName;
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  useLayoutEffect(() => {
    if (clientName) {
      navigation.setOptions({
        headerTitle: `${clientName} - Pending`,
      });
    }
  }, [navigation, clientName]);

  const { data: uploads = [], isLoading, refetch, isRefetching } = useQuery<Upload[]>({
    queryKey: ["/api/uploads/pending", clientId],
    queryFn: async () => {
      const url = clientId 
        ? new URL(`/api/uploads/client/${clientId}`, getApiUrl())
        : new URL("/api/uploads", getApiUrl());
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch uploads");
      const data = await res.json();
      
      if (clientId) {
        return data.filter((u: Upload) => u.status === "scheduled" && u.approvalStatus === "pending");
      }
      
      const allUploads: Upload[] = [];
      if (Array.isArray(data)) {
        data.forEach((clientData: any) => {
          if (clientData.uploads) {
            allUploads.push(...clientData.uploads);
          }
        });
      }
      return allUploads.filter(u => u.status === "scheduled" && u.approvalStatus === "pending");
    },
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: !clientId,
  });

  const clientMap = new Map(clients.map(c => [c.id, c.businessName]));

  if (isLoading) {
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
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={AppColors.orangePrimary} />
        }
      >
        <View style={styles.countBadge}>
          <ThemedText style={styles.countText}>
            {uploads.length} post{uploads.length !== 1 ? "s" : ""} pending approval
          </ThemedText>
        </View>

        {uploads.map((upload, index) => (
          <PostCard 
            key={upload.id} 
            upload={upload} 
            clientName={clientName || clientMap.get(upload.clientId) || "Unknown Client"}
            index={index} 
          />
        ))}

        {uploads.length === 0 ? (
          <View style={[styles.emptyState, Shadows.card]}>
            <Feather name="check-circle" size={48} color="#4CAF50" />
            <ThemedText type="h4" style={styles.emptyTitle}>All caught up!</ThemedText>
            <ThemedText style={styles.emptyText}>
              {clientName ? `No pending approvals for ${clientName}` : "No posts pending approval"}
            </ThemedText>
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  countBadge: {
    backgroundColor: AppColors.softCream,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
    marginBottom: Spacing.lg,
  },
  countText: {
    color: AppColors.orangePrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  postCard: {
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
  platformBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  platformText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  thumbnail: {
    width: "100%",
    height: 150,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  postTitle: {
    color: AppColors.primaryText,
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metaText: {
    color: AppColors.secondaryText,
    fontSize: 13,
  },
  statusRow: {
    marginBottom: Spacing.md,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  statusPending: {
    backgroundColor: "#FFF8E1",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  notesContainer: {
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.orangePrimary,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  notesLabel: {
    color: AppColors.secondaryText,
    fontWeight: "600",
    fontSize: 13,
  },
  notesText: {
    color: AppColors.primaryText,
    fontSize: 13,
    lineHeight: 20,
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
