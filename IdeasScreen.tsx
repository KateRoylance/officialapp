import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Platform,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
  Layout,
} from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, AppColors, Shadows } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

interface ContentIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  isCompleted: boolean;
  link?: string | null;
  mediaUri?: string | null;
  mediaType?: string | null;
}

interface ApiIdea {
  id: string;
  title: string;
  description: string;
  platform: string | null;
  category: string | null;
  clientIds: string | null;
  link: string | null;
  mediaUri: string | null;
  mediaType: string | null;
  createdAt: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getWeekRange(): string {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  
  return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
}

function IdeaCard({ 
  idea, 
  onToggle, 
  onOpenDetail,
  index 
}: { 
  idea: ContentIdea; 
  onToggle: () => void;
  onOpenDetail: () => void;
  index: number;
}) {
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(idea.isCompleted ? 1 : 0);

  useEffect(() => {
    checkScale.value = withSpring(idea.isCompleted ? 1 : 0, { damping: 12 });
  }, [idea.isCompleted]);

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onOpenDetail();
  };

  const handleToggle = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    checkScale.value = withSpring(idea.isCompleted ? 0 : 1, { damping: 12 });
    onToggle();
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: idea.isCompleted ? 0.6 : 1,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400)}
      layout={Layout.springify()}
    >
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[styles.ideaCard, Shadows.card, cardStyle]}
        testID={`card-idea-${idea.id}`}
      >
        <View style={styles.accentBar} />
        <View style={styles.ideaContent}>
          <View style={styles.ideaHeader}>
            <View style={styles.categoryBadge}>
              <Feather name="zap" size={12} color={AppColors.orangePrimary} />
              <ThemedText style={styles.categoryText}>{idea.category}</ThemedText>
            </View>
            <Pressable 
              onPress={handleToggle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Animated.View style={[styles.checkCircle, idea.isCompleted && styles.checkCircleActive, checkStyle]}>
                <Feather name="check" size={16} color={AppColors.white} />
              </Animated.View>
            </Pressable>
          </View>
          <ThemedText type="h4" style={[styles.ideaTitle, idea.isCompleted && styles.completedText]}>
            {idea.title}
          </ThemedText>
          <ThemedText style={[styles.ideaDescription, idea.isCompleted && styles.completedText]}>
            {idea.description}
          </ThemedText>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Image
        source={require("../../assets/images/empty-ideas.png")}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <ThemedText type="h4" style={styles.emptyTitle}>No Ideas Yet</ThemedText>
      <ThemedText style={styles.emptyText}>
        Content suggestions for your upcoming week will appear here
      </ThemedText>
    </View>
  );
}

export default function IdeasScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState("");

  const { data: apiIdeas = [], isLoading, refetch } = useQuery<ApiIdea[]>({
    queryKey: ["/api/ideas/client", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(new URL(`/api/ideas/client/${user.id}`, getApiUrl()).toString());
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.id,
    refetchOnMount: "always",
  });

  const ideas: ContentIdea[] = useMemo(() => {
    return apiIdeas
      .filter(idea => !hiddenIds.has(idea.id))
      .map(idea => ({
        id: idea.id,
        title: idea.title,
        description: idea.description,
        category: idea.category || "Content Idea",
        isCompleted: completedIds.has(idea.id),
        link: idea.link,
        mediaUri: idea.mediaUri,
        mediaType: idea.mediaType,
      }));
  }, [apiIdeas, completedIds, hiddenIds]);

  const toggleIdea = (id: string) => {
    setCompletedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
    if (selectedIdea && selectedIdea.id === id) {
      setSelectedIdea(prev => prev ? { ...prev, isCompleted: !prev.isCompleted } : null);
    }
  };

  const openDetail = (idea: ContentIdea) => {
    setSelectedIdea(idea);
    setDetailModalVisible(true);
  };

  const closeDetail = () => {
    setDetailModalVisible(false);
    setSelectedIdea(null);
    setShowDeleteConfirm(false);
    setDeleteFeedback("");
  };

  const handleUploadFromIdea = () => {
    closeDetail();
    navigation.navigate("UploadTab");
  };

  const handleNotForMe = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteIdea = () => {
    if (selectedIdea) {
      setHiddenIds(prev => new Set(prev).add(selectedIdea.id));
      closeDetail();
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteFeedback("");
  };

  const onRefresh = async () => {
    await refetch();
  };

  const completedCount = ideas.filter(i => i.isCompleted).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={ideas}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <IdeaCard 
            idea={item} 
            onToggle={() => toggleIdea(item.id)}
            onOpenDetail={() => openDetail(item)}
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
          ideas.length > 0 ? (
            <View style={styles.headerSection}>
              <ThemedText style={styles.progressText}>
                {completedCount} of {ideas.length} completed
              </ThemedText>
            </View>
          ) : null
        }
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={AppColors.orangePrimary}
            colors={[AppColors.orangePrimary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetail}
      >
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={closeDetail} style={styles.modalCloseButton}>
              <Feather name="x" size={24} color={AppColors.primaryText} />
            </Pressable>
            <ThemedText type="h4" style={styles.modalTitle}>Content Idea</ThemedText>
            <View style={styles.modalCloseButton} />
          </View>

          {selectedIdea ? (
            showDeleteConfirm ? (
              <ScrollView 
                style={styles.modalContent}
                contentContainerStyle={styles.confirmScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.confirmIconWrapper}>
                  <Feather name="alert-circle" size={48} color={AppColors.error} />
                </View>
                <ThemedText type="h3" style={styles.confirmTitle}>
                  Are you sure you wish to delete this content idea?
                </ThemedText>
                <ThemedText style={styles.confirmDescription}>
                  This action cannot be undone.
                </ThemedText>
                
                <ThemedText style={styles.feedbackLabel}>
                  Help us improve! Why isn't this content for you? (optional)
                </ThemedText>
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="e.g., Not relevant to my business, Already covered this topic..."
                  placeholderTextColor={AppColors.tertiaryText}
                  value={deleteFeedback}
                  onChangeText={setDeleteFeedback}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <View style={styles.confirmButtons}>
                  <Pressable onPress={handleDeleteIdea} style={styles.confirmButtonYes}>
                    <ThemedText style={styles.confirmButtonYesText}>Yes, Delete</ThemedText>
                  </Pressable>
                  <Pressable onPress={handleCancelDelete} style={styles.confirmButtonNo}>
                    <ThemedText style={styles.confirmButtonNoText}>No, Keep It</ThemedText>
                  </Pressable>
                </View>
              </ScrollView>
            ) : (
              <ScrollView 
                style={styles.modalContent}
                contentContainerStyle={styles.modalScrollContent}
              >
                <View style={styles.modalCategoryBadge}>
                  <Feather name="zap" size={14} color={AppColors.orangePrimary} />
                  <ThemedText style={styles.modalCategoryText}>{selectedIdea.category}</ThemedText>
                </View>

                <ThemedText 
                  type="h3" 
                  style={[styles.modalIdeaTitle, selectedIdea.isCompleted && styles.completedText]}
                >
                  {selectedIdea.title}
                </ThemedText>

                <ThemedText 
                  style={[styles.modalIdeaDescription, selectedIdea.isCompleted && styles.completedText]}
                >
                  {selectedIdea.description}
                </ThemedText>

                {selectedIdea.link ? (
                  <View style={styles.linkSection}>
                    <View style={styles.linkIconContainer}>
                      <Feather name="link" size={16} color={AppColors.orangePrimary} />
                    </View>
                    <ThemedText style={styles.linkText} numberOfLines={2}>
                      {selectedIdea.link}
                    </ThemedText>
                  </View>
                ) : null}

                {selectedIdea.mediaUri ? (
                  <View style={styles.mediaSection}>
                    <ThemedText style={styles.mediaSectionLabel}>Attached Media</ThemedText>
                    <View style={styles.mediaContainer}>
                      <Image
                        source={{ uri: selectedIdea.mediaUri }}
                        style={styles.mediaImage}
                        resizeMode="cover"
                      />
                      <View style={styles.mediaTypeIndicator}>
                        <Feather 
                          name={selectedIdea.mediaType === "video" ? "video" : "image"} 
                          size={14} 
                          color={AppColors.white} 
                        />
                      </View>
                    </View>
                  </View>
                ) : null}

                <Pressable
                  onPress={() => toggleIdea(selectedIdea.id)}
                  style={[
                    styles.markCompleteButton,
                    selectedIdea.isCompleted && styles.markCompleteButtonActive
                  ]}
                >
                  <Feather 
                    name={selectedIdea.isCompleted ? "check-circle" : "circle"} 
                    size={20} 
                    color={selectedIdea.isCompleted ? AppColors.success : AppColors.secondaryText} 
                  />
                  <ThemedText style={[
                    styles.markCompleteText,
                    selectedIdea.isCompleted && styles.markCompleteTextActive
                  ]}>
                    {selectedIdea.isCompleted ? "Marked as Complete" : "Mark as Complete"}
                  </ThemedText>
                </Pressable>

                <Pressable onPress={handleNotForMe} style={styles.notForMeButton}>
                  <Feather name="x-circle" size={20} color={AppColors.error} />
                  <ThemedText style={styles.notForMeText}>This content isn't for me</ThemedText>
                </Pressable>

                <View style={styles.divider} />

                <ThemedText style={styles.uploadPromptText}>
                  Have content ready for this idea?
                </ThemedText>

                <Pressable onPress={handleUploadFromIdea} style={styles.uploadButton}>
                  <LinearGradient
                    colors={[AppColors.orangePrimary, AppColors.orangeLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.uploadButtonGradient}
                  >
                    <Feather name="upload" size={20} color={AppColors.white} />
                    <ThemedText style={styles.uploadButtonText}>Upload Content</ThemedText>
                  </LinearGradient>
                </Pressable>
              </ScrollView>
            )
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    marginBottom: Spacing.xl,
  },
  weekBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.softCream,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
    marginBottom: Spacing.sm,
  },
  weekText: {
    marginLeft: Spacing.sm,
    color: AppColors.orangePrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  progressText: {
    color: AppColors.secondaryText,
    fontSize: 14,
  },
  ideaCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
    flexDirection: "row",
  },
  accentBar: {
    width: 4,
    backgroundColor: AppColors.orangePrimary,
  },
  ideaContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  ideaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.softCream,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    marginLeft: Spacing.xs,
    color: AppColors.orangePrimary,
    fontSize: 12,
    fontWeight: "500",
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: AppColors.neutral,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkCircleActive: {
    backgroundColor: AppColors.success,
    borderColor: AppColors.success,
  },
  ideaTitle: {
    marginBottom: Spacing.sm,
    color: AppColors.primaryText,
  },
  ideaDescription: {
    color: AppColors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
  },
  completedText: {
    textDecorationLine: "line-through",
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
    width: 40,
  },
  modalTitle: {
    color: AppColors.primaryText,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.xl,
  },
  modalCategoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.softCream,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
    marginBottom: Spacing.lg,
  },
  modalCategoryText: {
    marginLeft: Spacing.sm,
    color: AppColors.orangePrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  modalIdeaTitle: {
    color: AppColors.primaryText,
    marginBottom: Spacing.md,
  },
  modalIdeaDescription: {
    color: AppColors.secondaryText,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  markCompleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  markCompleteButtonActive: {
    backgroundColor: "#E8F5E9",
  },
  markCompleteText: {
    marginLeft: Spacing.sm,
    color: AppColors.secondaryText,
    fontSize: 15,
    fontWeight: "500",
  },
  markCompleteTextActive: {
    color: AppColors.success,
  },
  notForMeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  notForMeText: {
    marginLeft: Spacing.sm,
    color: AppColors.error,
    fontSize: 15,
    fontWeight: "500",
  },
  confirmScrollContent: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  confirmIconWrapper: {
    marginBottom: Spacing.xl,
  },
  feedbackLabel: {
    color: AppColors.secondaryText,
    fontSize: 14,
    marginBottom: Spacing.sm,
    alignSelf: "flex-start",
  },
  feedbackInput: {
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: AppColors.neutral,
    padding: Spacing.lg,
    fontSize: 15,
    color: AppColors.primaryText,
    minHeight: 100,
    width: "100%",
    marginBottom: Spacing.xl,
  },
  confirmTitle: {
    color: AppColors.primaryText,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  confirmDescription: {
    color: AppColors.secondaryText,
    textAlign: "center",
    marginBottom: Spacing["3xl"],
  },
  confirmButtons: {
    flexDirection: "column",
    gap: Spacing.md,
    width: "100%",
  },
  confirmButtonNo: {
    backgroundColor: AppColors.background,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  confirmButtonNoText: {
    color: AppColors.primaryText,
    fontWeight: "600",
    fontSize: 15,
  },
  confirmButtonYes: {
    backgroundColor: AppColors.error,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  confirmButtonYesText: {
    color: AppColors.white,
    fontWeight: "600",
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.neutral,
    marginBottom: Spacing.xl,
  },
  uploadPromptText: {
    color: AppColors.secondaryText,
    fontSize: 15,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  uploadButton: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  uploadButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  uploadButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
  linkSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.softCream,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  linkIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: {
    flex: 1,
    color: AppColors.orangePrimary,
    fontSize: 14,
  },
  mediaSection: {
    marginBottom: Spacing.lg,
  },
  mediaSectionLabel: {
    color: AppColors.secondaryText,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  mediaContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: AppColors.neutral,
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  mediaTypeIndicator: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: BorderRadius.xs,
    padding: 6,
  },
});
