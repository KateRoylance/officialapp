import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Modal,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors, Shadows } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/query-client";

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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type PlatformType = "instagram" | "facebook" | "tiktok";

interface ScheduledPost {
  id: string;
  title: string;
  description: string;
  caption: string;
  hashtags: string[];
  scheduledDate: Date;
  scheduledTime: string;
  status: "scheduled" | "approved" | "rejected";
  platform: PlatformType;
  contentType: "image" | "video" | "carousel" | "story";
  mediaPreview: string;
}

const PLATFORM_CONFIG: Record<PlatformType, { color: string; icon: string; name: string }> = {
  instagram: { color: "#E4405F", icon: "instagram", name: "Instagram" },
  facebook: { color: "#1877F2", icon: "facebook", name: "Facebook" },
  tiktok: { color: "#000000", icon: "music", name: "TikTok" },
};

const CONTENT_TYPE_ICONS: Record<string, string> = {
  image: "image",
  video: "video",
  carousel: "layers",
  story: "clock",
};

function getWeekDates(weekOffset: number = 0): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  // Calculate Monday of current week (Monday = 1, Sunday = 0)
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() + daysToMonday);
  
  // Apply week offset (0 = this week, 1 = next week)
  const targetMonday = new Date(thisMonday);
  targetMonday.setDate(thisMonday.getDate() + (weekOffset * 7));
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(targetMonday);
    date.setDate(targetMonday.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function getMonthYear(weekOffset: number = 0): string {
  const dates = getWeekDates(weekOffset);
  return dates[0].toLocaleDateString("en-US", { month: "long", year: "numeric" });
}


function DayCell({ 
  date, 
  posts, 
  onPress 
}: { 
  date: Date; 
  posts: ScheduledPost[];
  onPress: () => void;
}) {
  const hasPosts = posts.length > 0;
  const platforms = [...new Set(posts.map(p => p.platform))];
  const scale = useSharedValue(1);

  const cellStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.dayCellWrapper, cellStyle]}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPress();
        }}
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[
          styles.dayCell,
          hasPosts && styles.dayCellWithPosts,
        ]}
      >
        <ThemedText style={styles.dayNumber}>{date.getDate()}</ThemedText>
        
        {hasPosts ? (
          <View style={styles.platformIconsContainer}>
            {platforms.slice(0, 3).map((platform, index) => {
              const config = PLATFORM_CONFIG[platform];
              return (
                <View 
                  key={platform} 
                  style={[
                    styles.platformIconCircle,
                    { backgroundColor: config.color },
                    index > 0 && { marginLeft: -6 }
                  ]}
                >
                  <Feather name={config.icon as any} size={12} color="white" />
                </View>
              );
            })}
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function PostListItem({ post, onPress }: { post: ScheduledPost; onPress: () => void }) {
  const config = PLATFORM_CONFIG[post.platform];
  const scale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={cardStyle}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPress();
        }}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[styles.postListItem, Shadows.card]}
      >
        <View style={[styles.postListPlatform, { backgroundColor: config.color }]}>
          <Feather name={config.icon as any} size={16} color="white" />
        </View>
        <View style={styles.postListContent}>
          <ThemedText style={styles.postListTitle} numberOfLines={1}>{post.title}</ThemedText>
          <ThemedText style={styles.postListTime}>{post.scheduledTime}</ThemedText>
        </View>
        <View style={[
          styles.postListStatus,
          post.status === "approved" ? styles.statusApproved :
          post.status === "rejected" ? styles.statusRejected :
          styles.statusScheduled
        ]}>
          <ThemedText style={[
            styles.postListStatusText,
            post.status === "approved" ? styles.statusTextApproved :
            post.status === "rejected" ? styles.statusTextRejected :
            styles.statusTextScheduled
          ]}>
            {post.status === "scheduled" ? "Pending Approval" : 
             post.status.charAt(0).toUpperCase() + post.status.slice(1)}
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={AppColors.neutral} />
      </Pressable>
    </Animated.View>
  );
}

function MediaPreview({ post }: { post: ScheduledPost }) {
  const config = PLATFORM_CONFIG[post.platform];
  
  return (
    <View style={styles.mediaPreviewContainer}>
      <LinearGradient
        colors={[config.color + "40", config.color + "20", AppColors.softCream]}
        style={styles.mediaPreviewGradient}
      >
        <View style={styles.mediaPreviewContent}>
          <View style={[styles.mediaPreviewIcon, { backgroundColor: config.color }]}>
            <Feather 
              name={CONTENT_TYPE_ICONS[post.contentType] as any} 
              size={32} 
              color="white" 
            />
          </View>
          <ThemedText style={styles.mediaPreviewType}>
            {post.contentType.charAt(0).toUpperCase() + post.contentType.slice(1)} Preview
          </ThemedText>
          <ThemedText style={styles.mediaPreviewNote}>
            Content will be uploaded by your marketing team
          </ThemedText>
        </View>
      </LinearGradient>
      <View style={styles.platformBadgeOverlay}>
        <View style={[styles.platformBadgeLarge, { backgroundColor: config.color }]}>
          <Feather name={config.icon as any} size={18} color="white" />
          <ThemedText style={styles.platformBadgeText}>{config.name}</ThemedText>
        </View>
      </View>
    </View>
  );
}

function PostDetailModal({ 
  visible, 
  post, 
  onClose,
  onApprove,
  onReject,
}: { 
  visible: boolean;
  post: ScheduledPost | null;
  onClose: () => void;
  onApprove: (postId: string) => void;
  onReject: (postId: string) => void;
}) {
  const insets = useSafeAreaInsets();
  
  if (!post) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.postDetailHeader}>
          <View style={styles.modalDragHandle} />
          <View style={styles.postDetailTitleRow}>
            <ThemedText style={styles.postDetailTitle}>{post.title}</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={AppColors.primaryText} />
            </Pressable>
          </View>
          <ThemedText style={styles.postDetailSchedule}>
            {post.scheduledDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {post.scheduledTime}
          </ThemedText>
        </View>
        
        <ScrollView 
          style={styles.postDetailScroll}
          contentContainerStyle={[styles.postDetailScrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <MediaPreview post={post} />
          
          <View style={styles.captionSection}>
            <ThemedText style={styles.sectionLabel}>Caption</ThemedText>
            <View style={styles.captionBox}>
              <ThemedText style={styles.captionText}>{post.caption}</ThemedText>
            </View>
          </View>
          
          <View style={styles.hashtagsSection}>
            <ThemedText style={styles.sectionLabel}>Hashtags</ThemedText>
            <View style={styles.hashtagsContainer}>
              {post.hashtags.map((tag, index) => (
                <View key={index} style={styles.hashtagPill}>
                  <ThemedText style={styles.hashtagText}>{tag}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        
        {post.status === "approved" ? (
          <View style={[styles.approvedBanner, { paddingBottom: insets.bottom + Spacing.md }]}>
            <Feather name="check-circle" size={20} color="#4CAF50" />
            <ThemedText style={styles.approvedBannerText}>This post has been approved</ThemedText>
          </View>
        ) : (
          <View style={[styles.actionButtonsContainer, { paddingBottom: insets.bottom + Spacing.md }]}>
            <Pressable 
              style={styles.rejectButton}
              onPress={() => onReject(post.id)}
            >
              <Feather name="x-circle" size={20} color={AppColors.error} />
              <ThemedText style={styles.rejectButtonText}>Reject</ThemedText>
            </Pressable>
            <Pressable 
              style={styles.approveButton}
              onPress={() => onApprove(post.id)}
            >
              <Feather name="check-circle" size={20} color="white" />
              <ThemedText style={styles.approveButtonText}>Approve</ThemedText>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

function FeedbackModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    if (feedback.trim()) {
      onSubmit(feedback);
      setFeedback("");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={[styles.feedbackModal, { paddingTop: insets.top }]}
        behavior="padding"
      >
        <View style={styles.feedbackHeader}>
          <View style={styles.modalDragHandle} />
          <View style={styles.feedbackTitleRow}>
            <ThemedText style={styles.feedbackTitle}>Provide Feedback</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={AppColors.primaryText} />
            </Pressable>
          </View>
          <ThemedText style={styles.feedbackSubtitle}>
            Please let us know why you're rejecting this post so we can make improvements.
          </ThemedText>
        </View>
        
        <View style={styles.feedbackContent}>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Enter your feedback here..."
            placeholderTextColor={AppColors.secondaryText}
            multiline
            value={feedback}
            onChangeText={setFeedback}
            textAlignVertical="top"
          />
        </View>
        
        <View style={[styles.feedbackActions, { paddingBottom: insets.bottom + Spacing.md }]}>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </Pressable>
          <Pressable 
            style={[styles.submitButton, !feedback.trim() && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!feedback.trim()}
          >
            <ThemedText style={styles.submitButtonText}>Submit Feedback</ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function DayDetailModal({ 
  visible, 
  date, 
  posts, 
  onClose,
  onSelectPost,
  onPrevDay,
  onNextDay,
  canGoPrev,
  canGoNext,
}: { 
  visible: boolean;
  date: Date | null;
  posts: ScheduledPost[];
  onClose: () => void;
  onSelectPost: (post: ScheduledPost) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}) {
  const insets = useSafeAreaInsets();
  
  if (!date) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <View style={styles.modalDragHandle} />
          <View style={styles.modalTitleRow}>
            <Pressable 
              onPress={onPrevDay} 
              style={[styles.dayNavButton, !canGoPrev && styles.dayNavButtonDisabled]}
              disabled={!canGoPrev}
            >
              <Feather name="chevron-left" size={24} color={canGoPrev ? AppColors.orangePrimary : AppColors.neutral} />
            </Pressable>
            <View style={styles.dayTitleContainer}>
              <ThemedText style={styles.modalDay}>
                {date.toLocaleDateString("en-US", { weekday: "long" })}
              </ThemedText>
              <ThemedText style={styles.modalDate}>
                {date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </ThemedText>
            </View>
            <Pressable 
              onPress={onNextDay} 
              style={[styles.dayNavButton, !canGoNext && styles.dayNavButtonDisabled]}
              disabled={!canGoNext}
            >
              <Feather name="chevron-right" size={24} color={canGoNext ? AppColors.orangePrimary : AppColors.neutral} />
            </Pressable>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={AppColors.primaryText} />
            </Pressable>
          </View>
          <View style={styles.modalSubtitle}>
            <ThemedText style={styles.postsScheduledText}>
              {posts.length} {posts.length === 1 ? "post" : "posts"} scheduled
            </ThemedText>
          </View>
        </View>
        
        <ScrollView 
          style={styles.modalContent}
          contentContainerStyle={[styles.modalScrollContent, { paddingBottom: insets.bottom + Spacing.lg }]}
          showsVerticalScrollIndicator={false}
        >
          {posts.length > 0 ? posts.map((post) => (
            <PostListItem 
              key={post.id} 
              post={post} 
              onPress={() => onSelectPost(post)}
            />
          )) : (
            <View style={styles.noPostsContainer}>
              <Feather name="calendar" size={48} color={AppColors.neutral} />
              <ThemedText style={styles.noPostsText}>No posts scheduled for this day</ThemedText>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [postDetailVisible, setPostDetailVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, 1 = next week

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const monthYear = useMemo(() => getMonthYear(weekOffset), [weekOffset]);

  const handlePrevWeek = () => {
    if (weekOffset > 0) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setWeekOffset(0);
    }
  };

  const handleNextWeek = () => {
    if (weekOffset < 1) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setWeekOffset(1);
    }
  };

  // Fetch scheduled uploads for the logged-in client
  const { data: uploads = [], isLoading, refetch } = useQuery<Upload[]>({
    queryKey: ["/api/uploads/client", user?.id],
    enabled: !!user?.id,
  });

  // Convert API uploads to ScheduledPost format
  const posts: ScheduledPost[] = useMemo(() => {
    return uploads
      .filter(u => u.status === "scheduled" && u.scheduledFor)
      .map(u => {
        const scheduledDate = new Date(u.scheduledFor!);
        const hashtags = u.hashtags ? u.hashtags.split(" ").filter(h => h.startsWith("#")) : [];
        return {
          id: u.id,
          title: u.caption ? u.caption.substring(0, 30) + (u.caption.length > 30 ? "..." : "") : "Scheduled Post",
          description: u.clientNotes || "Content ready for review",
          caption: u.caption || "",
          hashtags,
          scheduledDate,
          scheduledTime: scheduledDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
          status: u.approvalStatus === "approved" ? "approved" : u.approvalStatus === "rejected" ? "rejected" : "scheduled",
          platform: (u.platform || "instagram") as PlatformType,
          contentType: u.type === "video" ? "video" : "image",
          mediaPreview: u.thumbnail || u.uri,
        };
      });
  }, [uploads]);

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (uploadId: string) => {
      return apiRequest("PATCH", `/api/uploads/${uploadId}`, { approvalStatus: "approved" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads/client", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to approve post. Please try again.");
    },
  });

  // Reject mutation (sends feedback)
  const rejectMutation = useMutation({
    mutationFn: async ({ uploadId, feedback }: { uploadId: string; feedback: string }) => {
      return apiRequest("PATCH", `/api/uploads/${uploadId}`, { 
        approvalStatus: "rejected",
        clientNotes: feedback 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads/client", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to submit feedback. Please try again.");
    },
  });

  const getPostsForDate = (date: Date) => {
    return posts.filter(p => p.scheduledDate.toDateString() === date.toDateString());
  };

  const pendingPosts = useMemo(() => posts.filter(p => p.status === "scheduled"), [posts]);

  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
    setDayModalVisible(true);
  };

  const handleSelectPost = (post: ScheduledPost) => {
    setDayModalVisible(false);
    setTimeout(() => {
      setSelectedPost(post);
      setPostDetailVisible(true);
    }, 300);
  };

  const handleUpcomingPostPress = (post: ScheduledPost) => {
    setSelectedPost(post);
    setPostDetailVisible(true);
  };

  const handleApprove = (postId: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    approveMutation.mutate(postId);
    setPostDetailVisible(false);
    setSelectedPost(null);
  };

  const handleReject = (postId: string) => {
    setPendingRejectId(postId);
    setPostDetailVisible(false);
    setTimeout(() => {
      setFeedbackVisible(true);
    }, 300);
  };

  const handleFeedbackSubmit = (feedback: string) => {
    if (pendingRejectId) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      rejectMutation.mutate({ uploadId: pendingRejectId, feedback });
      setPendingRejectId(null);
    }
    setFeedbackVisible(false);
    setSelectedPost(null);
  };

  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Day navigation within the week
  const getSelectedDateIndex = () => {
    if (!selectedDate) return -1;
    return weekDates.findIndex(d => d.toDateString() === selectedDate.toDateString());
  };

  const canGoPrev = getSelectedDateIndex() > 0;
  const canGoNext = getSelectedDateIndex() < weekDates.length - 1 && getSelectedDateIndex() >= 0;

  const handlePrevDay = () => {
    const currentIndex = getSelectedDateIndex();
    if (currentIndex > 0) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setSelectedDate(weekDates[currentIndex - 1]);
    }
  };

  const handleNextDay = () => {
    const currentIndex = getSelectedDateIndex();
    if (currentIndex < weekDates.length - 1 && currentIndex >= 0) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setSelectedDate(weekDates[currentIndex + 1]);
    }
  };

  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.md,
          paddingBottom: tabBarHeight + Spacing.xl,
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
        <Animated.View entering={FadeIn.duration(400)} style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <ThemedText style={styles.monthYear}>{monthYear}</ThemedText>
            <View style={styles.weekNavigator}>
              <Pressable 
                onPress={handlePrevWeek}
                style={[styles.weekNavButton, weekOffset === 0 && styles.weekNavButtonDisabled]}
                disabled={weekOffset === 0}
              >
                <Feather name="chevron-left" size={20} color={weekOffset === 0 ? AppColors.neutral : AppColors.orangePrimary} />
              </Pressable>
              <View style={styles.weekRangeBadge}>
                <ThemedText style={styles.weekRangeText}>{weekOffset === 0 ? "This Week" : "Next Week"}</ThemedText>
              </View>
              <Pressable 
                onPress={handleNextWeek}
                style={[styles.weekNavButton, weekOffset === 1 && styles.weekNavButtonDisabled]}
                disabled={weekOffset === 1}
              >
                <Feather name="chevron-right" size={20} color={weekOffset === 1 ? AppColors.neutral : AppColors.orangePrimary} />
              </Pressable>
            </View>
          </View>
          
          <View style={styles.dayNamesRow}>
            {dayNames.map(day => (
              <View key={day} style={styles.dayNameCell}>
                <ThemedText style={styles.dayNameText}>{day}</ThemedText>
              </View>
            ))}
          </View>
          
          <View style={styles.daysGrid}>
            {weekDates.map((date) => (
              <DayCell
                key={date.toISOString()}
                date={date}
                posts={getPostsForDate(date)}
                onPress={() => handleDayPress(date)}
              />
            ))}
          </View>
          
          <View style={styles.calendarLegend}>
            {(Object.keys(PLATFORM_CONFIG) as PlatformType[]).map(platform => {
              const config = PLATFORM_CONFIG[platform];
              return (
                <View key={platform} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: config.color }]} />
                  <ThemedText style={styles.legendLabel}>{config.name}</ThemedText>
                </View>
              );
            })}
          </View>
        </Animated.View>

        <View style={styles.upcomingSection}>
          <ThemedText style={styles.sectionTitle}>Posts pending approval</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            {pendingPosts.length} {pendingPosts.length === 1 ? "post" : "posts"} awaiting your approval
          </ThemedText>
          
          {(() => {
            const groupedByDate = pendingPosts.reduce((acc, post) => {
              const dateKey = post.scheduledDate.toDateString();
              if (!acc[dateKey]) {
                acc[dateKey] = { date: post.scheduledDate, posts: [] };
              }
              acc[dateKey].posts.push(post);
              return acc;
            }, {} as Record<string, { date: Date; posts: ScheduledPost[] }>);
            
            const sortedDates = Object.values(groupedByDate).sort((a, b) => a.date.getTime() - b.date.getTime());
            
            return sortedDates.map((group, dayIndex) => {
              const dayName = group.date.toLocaleDateString("en-US", { weekday: "long" });
              const dateStr = group.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              
              return (
                <View key={group.date.toISOString()} style={styles.dayGroup}>
                  <View style={styles.dayGroupHeader}>
                    <ThemedText style={styles.dayGroupTitle}>{dayName}</ThemedText>
                    <ThemedText style={styles.dayGroupDate}>{dateStr}</ThemedText>
                  </View>
                  {group.posts.map((post, index) => (
                    <Animated.View 
                      key={post.id} 
                      entering={FadeInDown.delay((dayIndex * 2 + index) * 40).duration(300)}
                    >
                      <PostListItem post={post} onPress={() => handleUpcomingPostPress(post)} />
                    </Animated.View>
                  ))}
                </View>
              );
            });
          })()}
          
          {pendingPosts.length === 0 ? (
            <View style={styles.noPostsContainer}>
              <Feather name="check-circle" size={48} color={AppColors.tertiaryText} />
              <ThemedText style={styles.noPostsText}>All posts approved! Check the calendar for scheduled posts.</ThemedText>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <DayDetailModal
        visible={dayModalVisible}
        date={selectedDate}
        posts={selectedDatePosts}
        onClose={() => setDayModalVisible(false)}
        onSelectPost={handleSelectPost}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
      />

      <PostDetailModal
        visible={postDetailVisible}
        post={selectedPost}
        onClose={() => {
          setPostDetailVisible(false);
          setSelectedPost(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <FeedbackModal
        visible={feedbackVisible}
        onClose={() => {
          setFeedbackVisible(false);
          setPendingRejectId(null);
        }}
        onSubmit={handleFeedbackSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  monthYear: {
    fontSize: 22,
    fontWeight: "700",
    color: AppColors.primaryText,
  },
  weekRangeBadge: {
    backgroundColor: AppColors.orangePrimary + "15",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  weekRangeText: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.orangePrimary,
  },
  weekNavigator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  weekNavButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.softCream,
  },
  weekNavButtonDisabled: {
    opacity: 0.4,
  },
  dayNamesRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  dayNameCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  dayNameText: {
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.secondaryText,
  },
  daysGrid: {
    flexDirection: "row",
  },
  dayCellWrapper: {
    flex: 1,
    padding: 2,
  },
  dayCell: {
    backgroundColor: AppColors.softCream,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    paddingHorizontal: 2,
    aspectRatio: 0.8,
  },
  dayCellWithPosts: {
    backgroundColor: AppColors.white,
    borderWidth: 2,
    borderColor: AppColors.orangePrimary + "40",
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.primaryText,
    marginBottom: Spacing.xs,
  },
  platformIconsContainer: {
    flexDirection: "row",
    marginTop: 2,
  },
  platformIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: AppColors.white,
  },
  postCountDot: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: AppColors.orangePrimary,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  postCountDotText: {
    fontSize: 9,
    fontWeight: "700",
    color: AppColors.white,
  },
  calendarLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppColors.neutral,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.xs,
  },
  legendLabel: {
    fontSize: 12,
    color: AppColors.secondaryText,
  },
  upcomingSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.primaryText,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: AppColors.secondaryText,
    marginBottom: Spacing.lg,
  },
  dayGroup: {
    marginBottom: Spacing.lg,
  },
  dayGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral,
  },
  dayGroupTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.primaryText,
  },
  dayGroupDate: {
    fontSize: 14,
    color: AppColors.secondaryText,
  },
  noPostsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
  noPostsText: {
    fontSize: 14,
    color: AppColors.tertiaryText,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  postListItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  postListPlatform: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  postListContent: {
    flex: 1,
  },
  postListTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.primaryText,
    marginBottom: 2,
  },
  postListTime: {
    fontSize: 13,
    color: AppColors.secondaryText,
  },
  postListStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  postListStatusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  statusScheduled: {
    backgroundColor: AppColors.orangePrimary + "15",
  },
  statusTextScheduled: {
    color: AppColors.orangePrimary,
  },
  statusApproved: {
    backgroundColor: "#E8F5E9",
  },
  statusTextApproved: {
    color: AppColors.success,
  },
  statusRejected: {
    backgroundColor: "#FFEBEE",
  },
  statusTextRejected: {
    color: AppColors.error,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  modalHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    backgroundColor: AppColors.neutral,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  modalTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNavButtonDisabled: {
    opacity: 0.4,
  },
  dayTitleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },
  modalDay: {
    fontSize: 14,
    color: AppColors.secondaryText,
    marginBottom: 2,
  },
  modalDate: {
    fontSize: 24,
    fontWeight: "700",
    color: AppColors.primaryText,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubtitle: {
    marginTop: Spacing.md,
  },
  postsScheduledText: {
    fontSize: 14,
    color: AppColors.orangePrimary,
    fontWeight: "500",
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  postDetailHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral,
  },
  postDetailTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  postDetailTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: AppColors.primaryText,
    flex: 1,
    marginRight: Spacing.md,
  },
  postDetailSchedule: {
    fontSize: 14,
    color: AppColors.secondaryText,
    marginTop: Spacing.sm,
  },
  postDetailScroll: {
    flex: 1,
  },
  postDetailScrollContent: {
    padding: Spacing.lg,
  },
  mediaPreviewContainer: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.xl,
    position: "relative",
  },
  mediaPreviewGradient: {
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaPreviewContent: {
    alignItems: "center",
  },
  mediaPreviewIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  mediaPreviewType: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.primaryText,
    marginBottom: Spacing.xs,
  },
  mediaPreviewNote: {
    fontSize: 13,
    color: AppColors.secondaryText,
    textAlign: "center",
  },
  platformBadgeOverlay: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
  },
  platformBadgeLarge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  platformBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "white",
    marginLeft: Spacing.xs,
  },
  captionSection: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.secondaryText,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  captionBox: {
    backgroundColor: AppColors.softCream,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  captionText: {
    fontSize: 15,
    color: AppColors.primaryText,
    lineHeight: 22,
  },
  hashtagsSection: {
    marginBottom: Spacing.xl,
  },
  hashtagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  hashtagPill: {
    backgroundColor: AppColors.orangePrimary + "15",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  hashtagText: {
    fontSize: 14,
    color: AppColors.orangePrimary,
    fontWeight: "500",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppColors.neutral,
    backgroundColor: AppColors.white,
  },
  approvedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: AppColors.neutral,
    backgroundColor: "#E8F5E9",
  },
  approvedBannerText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "600",
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: AppColors.error,
    backgroundColor: AppColors.white,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.error,
    marginLeft: Spacing.sm,
  },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: AppColors.success,
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: Spacing.sm,
  },
  feedbackModal: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  feedbackHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral,
  },
  feedbackTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.primaryText,
  },
  feedbackSubtitle: {
    fontSize: 14,
    color: AppColors.secondaryText,
    marginTop: Spacing.md,
    lineHeight: 20,
  },
  feedbackContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  feedbackInput: {
    flex: 1,
    backgroundColor: AppColors.softCream,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: 15,
    color: AppColors.primaryText,
    lineHeight: 22,
  },
  feedbackActions: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppColors.neutral,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: AppColors.softCream,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.secondaryText,
  },
  submitButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: AppColors.orangePrimary,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
