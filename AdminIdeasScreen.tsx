import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { AppColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface ContentIdea {
  id: string;
  title: string;
  description: string;
  platform: "instagram" | "facebook" | "tiktok" | "all";
  category: string;
  clientIds: string | null;
  clientNames: string | null;
  isFavourite: string | null;
  link: string | null;
  mediaUri: string | null;
  mediaType: string | null;
  createdAt: string;
}

interface Client {
  id: string;
  businessName: string;
  status: string;
}

export default function AdminIdeasScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [newIdeaDescription, setNewIdeaDescription] = useState("");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [saveAsFavourite, setSaveAsFavourite] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [ideaLink, setIdeaLink] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");

  const { data: ideas = [], isLoading, refetch } = useQuery<ContentIdea[]>({
    queryKey: ["/api/ideas"],
    refetchOnMount: "always",
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const allClients = clients;

  const favouriteIdeas = useMemo(() => 
    ideas.filter(idea => idea.isFavourite === "true"),
    [ideas]
  );

  const regularIdeas = useMemo(() => 
    ideas.filter(idea => idea.isFavourite !== "true"),
    [ideas]
  );

  const addIdeaMutation = useMutation({
    mutationFn: async (idea: { 
      title: string; 
      description: string; 
      clientIds: string[]; 
      isFavourite: boolean;
      link?: string;
      mediaUri?: string;
      mediaType?: string;
    }) => {
      return apiRequest("POST", "/api/ideas", idea);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      setNewIdeaTitle("");
      setNewIdeaDescription("");
      setSelectedClientIds([]);
      setSaveAsFavourite(false);
      setShowAddForm(false);
      setIdeaLink("");
      setMediaUrl("");
      setMediaType("image");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const deleteIdeaMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/ideas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleAddIdea = () => {
    if (newIdeaTitle.trim() && newIdeaDescription.trim() && selectedClientIds.length > 0) {
      addIdeaMutation.mutate({
        title: newIdeaTitle.trim(),
        description: newIdeaDescription.trim(),
        clientIds: selectedClientIds,
        isFavourite: saveAsFavourite,
        link: ideaLink.trim() || undefined,
        mediaUri: mediaUrl.trim() || undefined,
        mediaType: mediaUrl.trim() ? mediaType : undefined,
      });
    }
  };

  const useAsTemplate = (idea: ContentIdea) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNewIdeaTitle(idea.title);
    setNewIdeaDescription(idea.description);
    setSelectedClientIds([]);
    setSaveAsFavourite(false);
    setIdeaLink(idea.link || "");
    setMediaUrl(idea.mediaUri || "");
    setMediaType((idea.mediaType as "image" | "video") || "image");
    setShowAddForm(true);
  };

  const toggleClientSelection = (clientId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedClientIds(prev => 
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const selectAllClients = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedClientIds.length === allClients.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(allClients.map(c => c.id));
    }
  };

  const canSubmit = newIdeaTitle.trim() && newIdeaDescription.trim() && selectedClientIds.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: tabBarHeight }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={AppColors.orangePrimary}
          />
        }
      >
        <View style={styles.headerRow}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Content Ideas
          </ThemedText>
          <Pressable
            style={styles.addButton}
            onPress={() => {
              setShowAddForm(!showAddForm);
              if (!showAddForm) {
                setSelectedClientIds([]);
                setNewIdeaTitle("");
                setNewIdeaDescription("");
                setSaveAsFavourite(false);
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Feather
              name={showAddForm ? "x" : "plus"}
              size={20}
              color={AppColors.white}
            />
          </Pressable>
        </View>

        {showAddForm ? (
          <View style={[styles.addFormCard, Shadows.card]}>
            <TextInput
              style={styles.input}
              placeholder="Idea title..."
              placeholderTextColor={AppColors.tertiaryText}
              value={newIdeaTitle}
              onChangeText={setNewIdeaTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description..."
              placeholderTextColor={AppColors.tertiaryText}
              value={newIdeaDescription}
              onChangeText={setNewIdeaDescription}
              multiline
              numberOfLines={3}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Add a link (optional)..."
              placeholderTextColor={AppColors.tertiaryText}
              value={ideaLink}
              onChangeText={setIdeaLink}
              keyboardType="url"
              autoCapitalize="none"
            />
            
            <View style={styles.mediaSection}>
              <ThemedText style={styles.mediaSectionLabel}>Attach Media (optional)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Paste image or video URL..."
                placeholderTextColor={AppColors.tertiaryText}
                value={mediaUrl}
                onChangeText={setMediaUrl}
                keyboardType="url"
                autoCapitalize="none"
              />
              {mediaUrl.trim() ? (
                <View style={styles.mediaTypeRow}>
                  <Pressable
                    style={[styles.mediaTypeButton, mediaType === "image" && styles.mediaTypeButtonActive]}
                    onPress={() => setMediaType("image")}
                  >
                    <Feather name="image" size={16} color={mediaType === "image" ? AppColors.white : AppColors.orangePrimary} />
                    <ThemedText style={[styles.mediaTypeButtonText, mediaType === "image" && styles.mediaTypeButtonTextActive]}>Image</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.mediaTypeButton, mediaType === "video" && styles.mediaTypeButtonActive]}
                    onPress={() => setMediaType("video")}
                  >
                    <Feather name="video" size={16} color={mediaType === "video" ? AppColors.white : AppColors.orangePrimary} />
                    <ThemedText style={[styles.mediaTypeButtonText, mediaType === "video" && styles.mediaTypeButtonTextActive]}>Video</ThemedText>
                  </Pressable>
                </View>
              ) : null}
              {mediaUrl.trim() ? (
                <View style={styles.mediaPreviewContainer}>
                  <Image
                    source={{ uri: mediaUrl }}
                    style={styles.mediaPreview}
                    contentFit="cover"
                  />
                </View>
              ) : null}
            </View>
            
            <View style={styles.clientSelectionSection}>
              <View style={styles.clientSelectionHeader}>
                <ThemedText style={styles.clientSelectionLabel}>
                  Assign to clients
                </ThemedText>
                <Pressable onPress={selectAllClients}>
                  <ThemedText style={styles.selectAllText}>
                    {selectedClientIds.length === allClients.length ? "Deselect All" : "Select All"}
                  </ThemedText>
                </Pressable>
              </View>
              
              {allClients.length === 0 ? (
                <ThemedText style={styles.noClientsText}>
                  No clients available
                </ThemedText>
              ) : (
                <View style={styles.clientList}>
                  {allClients.map(client => (
                    <Pressable
                      key={client.id}
                      style={[
                        styles.clientChip,
                        selectedClientIds.includes(client.id) && styles.clientChipSelected,
                      ]}
                      onPress={() => toggleClientSelection(client.id)}
                    >
                      <Feather
                        name={selectedClientIds.includes(client.id) ? "check-circle" : "circle"}
                        size={16}
                        color={selectedClientIds.includes(client.id) ? AppColors.white : AppColors.secondaryText}
                      />
                      <ThemedText
                        style={[
                          styles.clientChipText,
                          selectedClientIds.includes(client.id) && styles.clientChipTextSelected,
                        ]}
                      >
                        {client.businessName}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}
              
              {selectedClientIds.length === 0 && (
                <ThemedText style={styles.selectionHint}>
                  Please select at least one client
                </ThemedText>
              )}
            </View>

            <View style={styles.favouriteToggleRow}>
              <View style={styles.favouriteInfo}>
                <Feather name="star" size={18} color={AppColors.orangePrimary} />
                <View>
                  <ThemedText style={styles.favouriteLabel}>Save as favourite</ThemedText>
                  <ThemedText style={styles.favouriteHint}>Reuse this idea as a template</ThemedText>
                </View>
              </View>
              <Switch
                value={saveAsFavourite}
                onValueChange={setSaveAsFavourite}
                trackColor={{ false: AppColors.neutral, true: AppColors.orangeLight }}
                thumbColor={saveAsFavourite ? AppColors.orangePrimary : AppColors.tertiaryText}
              />
            </View>

            <Pressable
              style={[
                styles.submitButton,
                !canSubmit && styles.submitButtonDisabled,
              ]}
              onPress={handleAddIdea}
              disabled={!canSubmit}
            >
              <ThemedText style={styles.submitButtonText}>
                {addIdeaMutation.isPending ? "Adding..." : "Add Idea"}
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        {favouriteIdeas.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Feather name="star" size={16} color={AppColors.orangePrimary} />
              <ThemedText style={styles.sectionLabel}>Favourite Templates</ThemedText>
            </View>
            <ThemedText style={styles.helperText}>
              Tap "Use" to create a new idea from a template
            </ThemedText>
            {favouriteIdeas.map((idea) => (
              <View key={idea.id} style={[styles.favouriteCard, Shadows.card]}>
                <View style={styles.favouriteHeader}>
                  <View style={styles.favouriteBadge}>
                    <Feather name="star" size={12} color={AppColors.orangePrimary} />
                    <ThemedText style={styles.favouriteBadgeText}>Template</ThemedText>
                  </View>
                  <View style={styles.favouriteActions}>
                    <Pressable
                      style={styles.useButton}
                      onPress={() => useAsTemplate(idea)}
                    >
                      <Feather name="copy" size={14} color={AppColors.orangePrimary} />
                      <ThemedText style={styles.useButtonText}>Use</ThemedText>
                    </Pressable>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        deleteIdeaMutation.mutate(idea.id);
                      }}
                    >
                      <Feather name="trash-2" size={16} color={AppColors.error} />
                    </Pressable>
                  </View>
                </View>
                <ThemedText style={styles.ideaTitle}>{idea.title}</ThemedText>
                <ThemedText style={styles.ideaDescription}>
                  {idea.description}
                </ThemedText>
              </View>
            ))}
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <Feather name="zap" size={16} color={AppColors.orangePrimary} />
          <ThemedText style={styles.sectionLabel}>Assigned Ideas</ThemedText>
        </View>
        <ThemedText style={styles.helperText}>
          Ideas assigned to specific clients
        </ThemedText>

        {regularIdeas.length === 0 ? (
          <View style={[styles.emptyCard, Shadows.card]}>
            <View style={styles.emptyIconContainer}>
              <Feather name="zap" size={48} color={AppColors.orangeLight} />
            </View>
            <ThemedText style={styles.emptyTitle}>No Ideas Yet</ThemedText>
            <ThemedText style={styles.emptyText}>
              Tap the + button to add content ideas for your clients
            </ThemedText>
          </View>
        ) : (
          regularIdeas.map((idea) => (
            <View key={idea.id} style={[styles.ideaCard, Shadows.card]}>
              <View style={styles.accentBar} />
              <View style={styles.ideaHeader}>
                <View style={styles.categoryBadge}>
                  <Feather name="zap" size={12} color={AppColors.orangePrimary} />
                  <ThemedText style={styles.categoryText}>Idea</ThemedText>
                </View>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    deleteIdeaMutation.mutate(idea.id);
                  }}
                >
                  <Feather name="trash-2" size={16} color={AppColors.error} />
                </Pressable>
              </View>
              <ThemedText style={styles.ideaTitle}>{idea.title}</ThemedText>
              <ThemedText style={styles.ideaDescription}>
                {idea.description}
              </ThemedText>
              {idea.clientNames ? (
                <View style={styles.assignedClientsRow}>
                  <Feather name="users" size={12} color={AppColors.secondaryText} />
                  <ThemedText style={styles.assignedClientsText}>
                    {idea.clientNames}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: AppColors.primaryText,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.orangePrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  addFormCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: AppColors.softCream,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 15,
    color: AppColors.primaryText,
    marginBottom: Spacing.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  clientSelectionSection: {
    marginBottom: Spacing.md,
  },
  clientSelectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  clientSelectionLabel: {
    color: AppColors.primaryText,
    fontSize: 14,
    fontWeight: "600",
  },
  selectAllText: {
    color: AppColors.orangePrimary,
    fontSize: 13,
    fontWeight: "500",
  },
  noClientsText: {
    color: AppColors.secondaryText,
    fontSize: 13,
    fontStyle: "italic",
  },
  clientList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  clientChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.softCream,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  clientChipSelected: {
    backgroundColor: AppColors.orangePrimary,
  },
  clientChipText: {
    color: AppColors.primaryText,
    fontSize: 13,
    fontWeight: "500",
  },
  clientChipTextSelected: {
    color: AppColors.white,
  },
  selectionHint: {
    color: AppColors.error,
    fontSize: 12,
    marginTop: Spacing.sm,
  },
  favouriteToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColors.softCream,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  favouriteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  favouriteLabel: {
    color: AppColors.primaryText,
    fontSize: 14,
    fontWeight: "500",
  },
  favouriteHint: {
    color: AppColors.secondaryText,
    fontSize: 12,
  },
  mediaSection: {
    marginBottom: Spacing.md,
  },
  mediaSectionLabel: {
    color: AppColors.secondaryText,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  mediaPreviewContainer: {
    position: "relative",
    width: 120,
    height: 120,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  mediaPreview: {
    width: "100%",
    height: "100%",
  },
  mediaTypeIndicator: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: BorderRadius.xs,
    padding: 4,
  },
  removeMediaButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  addMediaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.softCream,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: AppColors.orangeLight,
    borderStyle: "dashed",
    gap: Spacing.sm,
  },
  addMediaText: {
    color: AppColors.orangePrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  mediaTypeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  mediaTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: AppColors.orangePrimary,
    backgroundColor: AppColors.white,
    gap: Spacing.xs,
  },
  mediaTypeButtonActive: {
    backgroundColor: AppColors.orangePrimary,
  },
  mediaTypeButtonText: {
    color: AppColors.orangePrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  mediaTypeButtonTextActive: {
    color: AppColors.white,
  },
  submitButton: {
    backgroundColor: AppColors.orangePrimary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: AppColors.neutral,
  },
  submitButtonText: {
    color: AppColors.white,
    fontWeight: "600",
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    color: AppColors.primaryText,
    fontSize: 16,
    fontWeight: "600",
  },
  helperText: {
    color: AppColors.secondaryText,
    fontSize: 13,
    marginBottom: Spacing.lg,
  },
  favouriteCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: AppColors.orangeLight,
  },
  favouriteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  favouriteBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.softCream,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  favouriteBadgeText: {
    color: AppColors.orangePrimary,
    fontSize: 12,
    fontWeight: "500",
  },
  favouriteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  useButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.softCream,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  useButtonText: {
    color: AppColors.orangePrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing["2xl"],
    alignItems: "center",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    color: AppColors.primaryText,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  emptyText: {
    color: AppColors.secondaryText,
    fontSize: 14,
    textAlign: "center",
  },
  ideaCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: AppColors.orangePrimary,
  },
  ideaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.softCream,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  categoryText: {
    color: AppColors.orangePrimary,
    fontSize: 12,
    fontWeight: "500",
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  ideaTitle: {
    color: AppColors.primaryText,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  ideaDescription: {
    color: AppColors.secondaryText,
    fontSize: 14,
    lineHeight: 20,
  },
  assignedClientsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppColors.neutral,
  },
  assignedClientsText: {
    color: AppColors.secondaryText,
    fontSize: 12,
    flex: 1,
  },
});
