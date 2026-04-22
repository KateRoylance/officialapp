import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors, Shadows } from "@/constants/theme";

type ActivityType = "comment" | "dm";
type Platform_Type = "instagram" | "facebook" | "twitter" | "tiktok";

interface Reply {
  id: string;
  message: string;
  timestamp: Date;
  isFromClient: boolean;
}

interface SocialActivity {
  id: string;
  type: ActivityType;
  platform: Platform_Type;
  username: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isFavorite: boolean;
  avatar?: string;
  replies: Reply[];
}

type FilterType = "all" | "comments" | "dms" | "leads";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PLATFORM_COLORS: Record<Platform_Type, string> = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  twitter: "#1DA1F2",
  tiktok: "#000000",
};

const PLATFORM_ICONS: Record<Platform_Type, string> = {
  instagram: "instagram",
  facebook: "facebook",
  twitter: "twitter",
  tiktok: "music",
};

const SAMPLE_ACTIVITIES: SocialActivity[] = [
  {
    id: "1",
    type: "comment",
    platform: "instagram",
    username: "sarah_loves_flowers",
    message: "This is absolutely gorgeous! Where can I order?",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    isRead: false,
    isFavorite: false,
    replies: [],
  },
  {
    id: "2",
    type: "dm",
    platform: "instagram",
    username: "local_business_hub",
    message: "Hey! Would love to feature your products in our next story...",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    isRead: false,
    isFavorite: true,
    replies: [
      {
        id: "r1",
        message: "Thanks for reaching out! We'd love to collaborate. What do you have in mind?",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        isFromClient: true,
      },
    ],
  },
  {
    id: "3",
    type: "comment",
    platform: "facebook",
    username: "Emily Johnson",
    message: "Just ordered! Can't wait to receive it!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isRead: true,
    isFavorite: false,
    replies: [],
  },
  {
    id: "4",
    type: "dm",
    platform: "facebook",
    username: "Marketing Weekly",
    message: "We'd love to interview you for our small business spotlight...",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    isRead: true,
    isFavorite: true,
    replies: [],
  },
  {
    id: "5",
    type: "comment",
    platform: "tiktok",
    username: "viral_content_creator",
    message: "This video is amazing! Tutorial please!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isRead: true,
    isFavorite: false,
    replies: [],
  },
];

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function ActivityCard({ 
  activity, 
  onPress,
  onToggleFavorite,
  index,
  showAnimation = true,
}: { 
  activity: SocialActivity; 
  onPress: () => void;
  onToggleFavorite: () => void;
  index: number;
  showAnimation?: boolean;
}) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const handleFavorite = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggleFavorite();
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const CardContent = (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => { scale.value = withSpring(0.98); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[styles.activityCard, Shadows.card, cardStyle]}
      testID={`card-activity-${activity.id}`}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: PLATFORM_COLORS[activity.platform] + "20" }]}>
          <Feather 
            name={PLATFORM_ICONS[activity.platform] as any} 
            size={20} 
            color={PLATFORM_COLORS[activity.platform]} 
          />
        </View>
        {!activity.isRead ? <View style={styles.unreadDot} /> : null}
      </View>

      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <ThemedText style={styles.username}>{activity.username}</ThemedText>
          <View style={styles.typeBadge}>
            <Feather 
              name={activity.type === "comment" ? "message-circle" : "send"} 
              size={10} 
              color={AppColors.secondaryText} 
            />
            <ThemedText style={styles.typeText}>
              {activity.type === "comment" ? "Comment" : "DM"}
            </ThemedText>
          </View>
        </View>
        <ThemedText 
          style={[styles.message, !activity.isRead && styles.unreadMessage]} 
          numberOfLines={2}
        >
          {activity.message}
        </ThemedText>
        <ThemedText style={styles.timestamp}>{formatTimeAgo(activity.timestamp)}</ThemedText>
      </View>

      <Pressable 
        onPress={handleFavorite} 
        style={styles.favoriteButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        testID={`button-favorite-${activity.id}`}
      >
        <Feather 
          name={activity.isFavorite ? "star" : "star"} 
          size={20} 
          color={activity.isFavorite ? "#FFB800" : AppColors.tertiaryText}
          style={activity.isFavorite ? { fill: "#FFB800" } : undefined}
        />
      </Pressable>
    </AnimatedPressable>
  );

  if (showAnimation) {
    return (
      <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
        {CardContent}
      </Animated.View>
    );
  }

  return CardContent;
}

function FilterChip({ 
  label, 
  isActive, 
  onPress 
}: { 
  label: string; 
  isActive: boolean; 
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterChip, isActive && styles.filterChipActive]}
    >
      <ThemedText style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Image
        source={require("../../assets/images/empty-social.png")}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <ThemedText type="h4" style={styles.emptyTitle}>No Activity Yet</ThemedText>
      <ThemedText style={styles.emptyText}>
        Comments and messages from your social accounts will appear here
      </ThemedText>
    </View>
  );
}

function MessageDetailModal({
  activity,
  visible,
  onClose,
  onToggleFavorite,
  onSendReply,
}: {
  activity: SocialActivity | null;
  visible: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onSendReply: (message: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!activity) return null;

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    
    setIsSending(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    onSendReply(replyText.trim());
    setReplyText("");
    setIsSending(false);
  };

  const platformName = activity.platform.charAt(0).toUpperCase() + activity.platform.slice(1);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} style={styles.modalCloseButton}>
            <Feather name="x" size={24} color={AppColors.primaryText} />
          </Pressable>
          <ThemedText type="h4" style={styles.modalTitle}>
            {activity.type === "comment" ? "Comment" : "Direct Message"}
          </ThemedText>
          <Pressable onPress={onToggleFavorite} style={styles.modalFavoriteButton}>
            <Feather 
              name="star" 
              size={24} 
              color={activity.isFavorite ? "#FFB800" : AppColors.tertiaryText} 
            />
          </Pressable>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContent}
          keyboardVerticalOffset={0}
        >
          <ScrollView 
            style={styles.conversationScroll}
            contentContainerStyle={styles.conversationContent}
          >
            <View style={styles.platformBadge}>
              <View style={[styles.platformIcon, { backgroundColor: PLATFORM_COLORS[activity.platform] + "20" }]}>
                <Feather 
                  name={PLATFORM_ICONS[activity.platform] as any} 
                  size={16} 
                  color={PLATFORM_COLORS[activity.platform]} 
                />
              </View>
              <ThemedText style={styles.platformName}>{platformName}</ThemedText>
            </View>

            <View style={styles.originalMessage}>
              <View style={styles.messageUserRow}>
                <ThemedText style={styles.messageUsername}>{activity.username}</ThemedText>
                <ThemedText style={styles.messageTime}>{formatTimeAgo(activity.timestamp)}</ThemedText>
              </View>
              <ThemedText style={styles.messageText}>{activity.message}</ThemedText>
            </View>

            {activity.replies.length > 0 ? (
              <View style={styles.repliesSection}>
                <ThemedText style={styles.repliesSectionTitle}>Conversation</ThemedText>
                {activity.replies.map((reply) => (
                  <View 
                    key={reply.id} 
                    style={[
                      styles.replyBubble,
                      reply.isFromClient ? styles.replyBubbleClient : styles.replyBubbleOther
                    ]}
                  >
                    <ThemedText style={[
                      styles.replyText,
                      reply.isFromClient ? styles.replyTextClient : styles.replyTextOther
                    ]}>
                      {reply.message}
                    </ThemedText>
                    <ThemedText style={[
                      styles.replyTime,
                      reply.isFromClient ? styles.replyTimeClient : styles.replyTimeOther
                    ]}>
                      {reply.isFromClient ? "You" : activity.username} - {formatTimeAgo(reply.timestamp)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.replyInputContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder={`Reply to ${activity.username}...`}
              placeholderTextColor={AppColors.tertiaryText}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={500}
              testID="input-reply"
            />
            <Pressable 
              onPress={handleSendReply}
              disabled={!replyText.trim() || isSending}
              style={[
                styles.sendButton,
                (!replyText.trim() || isSending) && styles.sendButtonDisabled
              ]}
              testID="button-send-reply"
            >
              <Feather 
                name={isSending ? "loader" : "send"} 
                size={20} 
                color={!replyText.trim() || isSending ? AppColors.tertiaryText : AppColors.white} 
              />
            </Pressable>
          </View>

          <View style={styles.replyNote}>
            <Feather name="info" size={14} color={AppColors.tertiaryText} />
            <ThemedText style={styles.replyNoteText}>
              Replies will be sent to {platformName}
            </ThemedText>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function SocialScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const [activities, setActivities] = useState<SocialActivity[]>(SAMPLE_ACTIVITIES);
  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<SocialActivity | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  
  const isMessageActive = (activity: SocialActivity): boolean => {
    const now = new Date().getTime();
    const lastActivityTime = activity.replies.length > 0 
      ? Math.max(...activity.replies.map(r => r.timestamp.getTime()))
      : activity.timestamp.getTime();
    
    return (now - lastActivityTime) < SEVEN_DAYS_MS;
  };

  const activeActivities = activities.filter(isMessageActive);

  const filteredActivities = activeActivities.filter(activity => {
    if (filter === "all") return true;
    if (filter === "comments") return activity.type === "comment";
    if (filter === "dms") return activity.type === "dm";
    if (filter === "leads") return activity.isFavorite;
    return true;
  });

  const leadsCount = activeActivities.filter(a => a.isFavorite).length;
  const unreadCount = activeActivities.filter(a => !a.isRead).length;

  const openMessageDetail = (activity: SocialActivity) => {
    setSelectedActivity(activity);
    setShowDetailModal(true);
    markAsRead(activity.id);
  };

  const closeMessageDetail = () => {
    setShowDetailModal(false);
    setSelectedActivity(null);
  };

  const markAsRead = (id: string) => {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === id ? { ...activity, isRead: true } : activity
      )
    );
  };

  const toggleFavorite = (id: string) => {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === id ? { ...activity, isFavorite: !activity.isFavorite } : activity
      )
    );
    if (selectedActivity && selectedActivity.id === id) {
      setSelectedActivity(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  const sendReply = (activityId: string, message: string) => {
    const newReply: Reply = {
      id: `r${Date.now()}`,
      message,
      timestamp: new Date(),
      isFromClient: true,
    };
    
    setActivities(prev =>
      prev.map(activity =>
        activity.id === activityId 
          ? { ...activity, replies: [...activity.replies, newReply] } 
          : activity
      )
    );
    
    if (selectedActivity && selectedActivity.id === activityId) {
      setSelectedActivity(prev => 
        prev ? { ...prev, replies: [...prev.replies, newReply] } : null
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={filteredActivities}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <ActivityCard 
            activity={item} 
            onPress={() => openMessageDetail(item)}
            onToggleFavorite={() => toggleFavorite(item.id)}
            index={index}
          />
        )}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {unreadCount > 0 ? (
              <View style={styles.unreadBanner}>
                <Feather name="bell" size={16} color={AppColors.orangePrimary} />
                <ThemedText style={styles.unreadText}>
                  {unreadCount} new {unreadCount === 1 ? "notification" : "notifications"}
                </ThemedText>
              </View>
            ) : null}
            <View style={styles.filterRow}>
              <FilterChip 
                label="All" 
                isActive={filter === "all"} 
                onPress={() => setFilter("all")} 
              />
              <FilterChip 
                label="Comments" 
                isActive={filter === "comments"} 
                onPress={() => setFilter("comments")} 
              />
              <FilterChip 
                label="DMs" 
                isActive={filter === "dms"} 
                onPress={() => setFilter("dms")} 
              />
              <FilterChip 
                label={`Leads${leadsCount > 0 ? ` (${leadsCount})` : ""}`}
                isActive={filter === "leads"} 
                onPress={() => setFilter("leads")} 
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          filter === "leads" ? (
            <View style={styles.emptyLeadsContainer}>
              <Feather name="star" size={48} color={AppColors.tertiaryText} />
              <ThemedText type="h4" style={styles.emptyTitle}>No Leads Yet</ThemedText>
              <ThemedText style={styles.emptyText}>
                Tap the star on any message to save potential customers here
              </ThemedText>
            </View>
          ) : (
            <EmptyState />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={AppColors.orangePrimary}
            colors={[AppColors.orangePrimary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <MessageDetailModal
        activity={selectedActivity}
        visible={showDetailModal}
        onClose={closeMessageDetail}
        onToggleFavorite={() => selectedActivity && toggleFavorite(selectedActivity.id)}
        onSendReply={(message) => selectedActivity && sendReply(selectedActivity.id, message)}
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
  unreadBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.softCream,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  unreadText: {
    marginLeft: Spacing.sm,
    color: AppColors.orangePrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.neutral,
  },
  filterChipActive: {
    backgroundColor: AppColors.orangePrimary,
    borderColor: AppColors.orangePrimary,
  },
  filterChipText: {
    fontSize: 14,
    color: AppColors.secondaryText,
  },
  filterChipTextActive: {
    color: AppColors.white,
    fontWeight: "600",
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    position: "relative",
    marginRight: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.orangePrimary,
    borderWidth: 2,
    borderColor: AppColors.white,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  username: {
    fontWeight: "600",
    color: AppColors.primaryText,
    fontSize: 14,
    marginRight: Spacing.sm,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  typeText: {
    fontSize: 10,
    color: AppColors.secondaryText,
    marginLeft: 3,
  },
  message: {
    color: AppColors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  unreadMessage: {
    color: AppColors.primaryText,
    fontWeight: "700",
  },
  timestamp: {
    fontSize: 12,
    color: AppColors.tertiaryText,
  },
  favoriteButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  leadsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF9E6",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  leadsBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  leadsBannerText: {
    marginLeft: Spacing.sm,
    color: "#B8860B",
    fontWeight: "600",
    fontSize: 14,
  },
  leadsBannerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  leadsBannerAction: {
    color: AppColors.orangePrimary,
    fontWeight: "600",
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  backButtonText: {
    marginLeft: Spacing.sm,
    color: AppColors.orangePrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  leadsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  leadsTitle: {
    marginLeft: Spacing.sm,
    color: AppColors.primaryText,
  },
  leadsSubtitle: {
    color: AppColors.secondaryText,
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  emptyLeadsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
    paddingTop: Spacing["3xl"],
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    color: AppColors.primaryText,
    textAlign: "center",
  },
  emptyText: {
    color: AppColors.secondaryText,
    textAlign: "center",
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral,
  },
  modalCloseButton: {
    padding: Spacing.sm,
  },
  modalTitle: {
    color: AppColors.primaryText,
  },
  modalFavoriteButton: {
    padding: Spacing.sm,
  },
  modalContent: {
    flex: 1,
  },
  conversationScroll: {
    flex: 1,
  },
  conversationContent: {
    padding: Spacing.lg,
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  platformIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  platformName: {
    marginLeft: Spacing.sm,
    fontSize: 14,
    color: AppColors.secondaryText,
    fontWeight: "500",
  },
  originalMessage: {
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  messageUserRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  messageUsername: {
    fontWeight: "600",
    fontSize: 15,
    color: AppColors.primaryText,
  },
  messageTime: {
    fontSize: 12,
    color: AppColors.tertiaryText,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.primaryText,
  },
  repliesSection: {
    marginTop: Spacing.md,
  },
  repliesSectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.secondaryText,
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  replyBubble: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    maxWidth: "85%",
  },
  replyBubbleClient: {
    backgroundColor: AppColors.orangePrimary,
    alignSelf: "flex-end",
  },
  replyBubbleOther: {
    backgroundColor: AppColors.background,
    alignSelf: "flex-start",
  },
  replyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  replyTextClient: {
    color: AppColors.white,
  },
  replyTextOther: {
    color: AppColors.primaryText,
  },
  replyTime: {
    fontSize: 11,
    marginTop: Spacing.xs,
  },
  replyTimeClient: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  replyTimeOther: {
    color: AppColors.tertiaryText,
  },
  replyInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppColors.neutral,
    backgroundColor: AppColors.white,
  },
  replyInput: {
    flex: 1,
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    color: AppColors.primaryText,
    maxHeight: 100,
    marginRight: Spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.orangePrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: AppColors.neutral,
  },
  replyNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: AppColors.background,
  },
  replyNoteText: {
    fontSize: 12,
    color: AppColors.tertiaryText,
    marginLeft: Spacing.xs,
  },
});
