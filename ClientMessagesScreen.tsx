import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { AppColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { AdminStackParamList } from "@/navigation/types";

type MessageType = "dm" | "comment";

interface Message {
  id: string;
  type: MessageType;
  platform: "instagram" | "facebook" | "tiktok";
  senderName: string;
  senderHandle: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  postTitle?: string;
}

const PLATFORM_COLORS = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  tiktok: "#000000",
};

const SAMPLE_MESSAGES: Message[] = [
  { id: "1", type: "dm", platform: "instagram", senderName: "Emma Wilson", senderHandle: "@emmaw", content: "Hi! I saw your spring menu and I'm interested in ordering a cake for my daughter's birthday. Do you do custom designs?", timestamp: "10 min ago", isRead: false, isStarred: false },
  { id: "2", type: "comment", platform: "instagram", senderName: "John Davis", senderHandle: "@johnd", content: "These look absolutely delicious! What's the price for a dozen cupcakes?", timestamp: "25 min ago", isRead: false, isStarred: true, postTitle: "New Spring Menu Launch" },
  { id: "3", type: "dm", platform: "facebook", senderName: "Sarah Miller", senderHandle: "Sarah Miller", content: "Do you cater for corporate events? We're looking for a vendor for our company anniversary.", timestamp: "1 hour ago", isRead: false, isStarred: false },
  { id: "4", type: "comment", platform: "instagram", senderName: "Mike Chen", senderHandle: "@mikechen", content: "Love the new flavors! Can't wait to try the lavender honey.", timestamp: "2 hours ago", isRead: true, isStarred: false, postTitle: "New Spring Menu Launch" },
  { id: "5", type: "dm", platform: "instagram", senderName: "Lisa Brown", senderHandle: "@lisab", content: "What are your opening hours on weekends?", timestamp: "3 hours ago", isRead: true, isStarred: false },
];

type FilterType = "all" | "dm" | "comment";

function MessageCard({ message, index, onToggleStar }: { message: Message; index: number; onToggleStar: (id: string) => void }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <View style={[styles.messageCard, Shadows.card, !message.isRead && styles.messageCardUnread]}>
        <View style={styles.messageHeader}>
          <View style={styles.senderInfo}>
            <View style={[styles.senderAvatar, { backgroundColor: PLATFORM_COLORS[message.platform] + "20" }]}>
              <ThemedText style={[styles.senderAvatarText, { color: PLATFORM_COLORS[message.platform] }]}>
                {message.senderName.charAt(0)}
              </ThemedText>
            </View>
            <View>
              <ThemedText type="h4" style={styles.senderName}>{message.senderName}</ThemedText>
              <ThemedText style={styles.senderHandle}>{message.senderHandle}</ThemedText>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <Pressable onPress={() => onToggleStar(message.id)} style={styles.starButton}>
              <Feather 
                name={message.isStarred ? "star" : "star"} 
                size={20} 
                color={message.isStarred ? "#FFC107" : AppColors.tertiaryText}
                style={message.isStarred ? { fill: "#FFC107" } : undefined}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, message.type === "dm" ? styles.dmBadge : styles.commentBadge]}>
            <Feather 
              name={message.type === "dm" ? "message-circle" : "message-square"} 
              size={12} 
              color={message.type === "dm" ? "#2196F3" : "#9C27B0"} 
            />
            <ThemedText style={[styles.typeBadgeText, { color: message.type === "dm" ? "#2196F3" : "#9C27B0" }]}>
              {message.type === "dm" ? "Direct Message" : "Comment"}
            </ThemedText>
          </View>
          <View style={[styles.platformBadge, { backgroundColor: PLATFORM_COLORS[message.platform] }]}>
            <ThemedText style={styles.platformText}>
              {message.platform.charAt(0).toUpperCase() + message.platform.slice(1)}
            </ThemedText>
          </View>
        </View>

        {message.postTitle ? (
          <View style={styles.postReference}>
            <Feather name="link" size={12} color={AppColors.secondaryText} />
            <ThemedText style={styles.postReferenceText}>On: {message.postTitle}</ThemedText>
          </View>
        ) : null}

        <ThemedText style={styles.messageContent}>{message.content}</ThemedText>

        <View style={styles.messageFooter}>
          <ThemedText style={styles.timestamp}>{message.timestamp}</ThemedText>
          {!message.isRead ? (
            <View style={styles.unreadDot} />
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

export default function ClientMessagesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const route = useRoute<RouteProp<AdminStackParamList, "ClientMessages">>();
  const [filter, setFilter] = useState<FilterType>("all");
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);

  const toggleStar = (id: string) => {
    setMessages(prev => prev.map(m => 
      m.id === id ? { ...m, isStarred: !m.isStarred } : m
    ));
  };

  const filteredMessages = messages.filter(m => {
    if (filter === "all") return true;
    return m.type === filter;
  });

  const dmCount = messages.filter(m => m.type === "dm").length;
  const commentCount = messages.filter(m => m.type === "comment").length;

  const filters: { key: FilterType; label: string; count?: number }[] = [
    { key: "all", label: "All", count: messages.length },
    { key: "dm", label: "DMs", count: dmCount },
    { key: "comment", label: "Comments", count: commentCount },
  ];

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
      >
        <View style={styles.filterContainer}>
          {filters.map(f => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterButton, filter === f.key && styles.filterButtonActive]}
            >
              <ThemedText style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label} ({f.count})
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.tipCard}>
          <Feather name="star" size={16} color="#FFC107" />
          <ThemedText style={styles.tipText}>
            Tap the star icon to mark potential leads
          </ThemedText>
        </View>

        {filteredMessages.map((message, index) => (
          <MessageCard 
            key={message.id} 
            message={message} 
            index={index} 
            onToggleStar={toggleStar}
          />
        ))}

        {filteredMessages.length === 0 ? (
          <View style={[styles.emptyState, Shadows.card]}>
            <Feather name="inbox" size={48} color={AppColors.tertiaryText} />
            <ThemedText type="h4" style={styles.emptyTitle}>No messages</ThemedText>
            <ThemedText style={styles.emptyText}>No messages in this category</ThemedText>
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
  filterContainer: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.white,
  },
  filterButtonActive: {
    backgroundColor: AppColors.orangePrimary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.secondaryText,
  },
  filterTextActive: {
    color: AppColors.white,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  tipText: {
    color: AppColors.secondaryText,
    fontSize: 13,
  },
  messageCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  messageCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: "#2196F3",
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  senderInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  senderAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  senderAvatarText: {
    fontWeight: "700",
    fontSize: 16,
  },
  senderName: {
    color: AppColors.primaryText,
    fontSize: 14,
  },
  senderHandle: {
    color: AppColors.secondaryText,
    fontSize: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  starButton: {
    padding: Spacing.sm,
  },
  badgeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  dmBadge: {
    backgroundColor: "#E3F2FD",
  },
  commentBadge: {
    backgroundColor: "#F3E5F5",
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  platformBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  platformText: {
    color: AppColors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  postReference: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  postReferenceText: {
    color: AppColors.secondaryText,
    fontSize: 12,
    fontStyle: "italic",
  },
  messageContent: {
    color: AppColors.primaryText,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  timestamp: {
    color: AppColors.tertiaryText,
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2196F3",
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
