import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { AppColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";

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
  scheduledFor: string | null;
  scheduledAt: string | null;
  uploadedAt: string | null;
}

interface ClientUploadGroup {
  client: {
    id: string;
    name: string;
    avatar: string;
  };
  uploads: Upload[];
}

function ClientUploadCard({ client, uploads, index, onPress }: { client: ClientUploadGroup["client"]; uploads: Upload[]; index: number; onPress: () => void }) {
  const uploadsWithNotes = uploads.filter(u => u.clientNotes).length;
  const newUploads = uploads.filter(u => u.status === "new");
  const totalUploads = uploads.length;

  const getSubtitle = () => {
    if (newUploads.length > 0) {
      return `${newUploads.length} new upload${newUploads.length !== 1 ? "s" : ""}${uploadsWithNotes > 0 ? ` • ${uploadsWithNotes} with notes` : ""}`;
    }
    if (totalUploads > 0) {
      return `${totalUploads} upload${totalUploads !== 1 ? "s" : ""} (all scheduled)`;
    }
    return "No uploads yet";
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <Pressable style={[styles.clientCard, Shadows.card]} onPress={onPress}>
        <View style={styles.clientHeader}>
          <View style={[styles.clientAvatar, totalUploads === 0 && styles.clientAvatarEmpty]}>
            <ThemedText style={[styles.clientAvatarText, totalUploads === 0 && styles.clientAvatarTextEmpty]}>
              {client.avatar}
            </ThemedText>
          </View>
          <View style={styles.clientInfo}>
            <ThemedText type="h4" style={styles.clientName}>{client.name}</ThemedText>
            <ThemedText style={[styles.uploadCount, totalUploads === 0 && styles.noUploadsText]}>
              {getSubtitle()}
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={AppColors.tertiaryText} />
        </View>

        {newUploads.length > 0 ? (
          <View style={styles.uploadsPreview}>
            {newUploads.slice(0, 4).map((upload) => (
              <View key={upload.id} style={styles.previewItem}>
                <Image source={{ uri: upload.thumbnail || upload.uri }} style={styles.previewImage} />
                {upload.clientNotes ? (
                  <View style={styles.notesIndicator}>
                    <Feather name="message-circle" size={10} color={AppColors.white} />
                  </View>
                ) : null}
              </View>
            ))}
            {newUploads.length > 4 ? (
              <View style={styles.moreIndicator}>
                <ThemedText style={styles.moreText}>+{newUploads.length - 4}</ThemedText>
              </View>
            ) : null}
          </View>
        ) : totalUploads === 0 ? (
          <View style={styles.noUploadsContainer}>
            <Feather name="image" size={20} color={AppColors.tertiaryText} />
            <ThemedText style={styles.noUploadsHint}>Tap to upload content for this client</ThemedText>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

interface UploadDetailModalProps {
  visible: boolean;
  upload: Upload | null;
  clientName: string;
  onClose: () => void;
  onUpdateStatus: (uploadId: string, status: string, scheduledFor?: string, caption?: string, hashtags?: string, platform?: string) => void;
  onDelete: (uploadId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

const PLATFORM_OPTIONS = [
  { label: "Select Platform", value: "" },
  { label: "Instagram", value: "instagram" },
  { label: "Facebook", value: "facebook" },
  { label: "TikTok", value: "tiktok" },
];

function UploadDetailModal({ visible, upload, clientName, onClose, onUpdateStatus, onDelete, isUpdating, isDeleting }: UploadDetailModalProps) {
  const insets = useSafeAreaInsets();
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platform, setPlatform] = useState("");
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    if (upload) {
      setCaption(upload.caption || "");
      setHashtags(upload.hashtags || "");
      setPlatform(upload.platform || "");
      setScheduledDate("");
      setScheduledTime("");
      setShowDeleteConfirm(false);
    }
  }, [upload]);

  if (!upload) return null;

  const handleSchedule = () => {
    if (!scheduledDate || !scheduledTime) {
      Alert.alert("Required Fields", "Please enter both a date and time for scheduling.");
      return;
    }
    if (!platform) {
      Alert.alert("Required Fields", "Please select a platform for this post.");
      return;
    }
    const scheduledFor = `${scheduledDate}T${scheduledTime}:00`;
    onUpdateStatus(upload.id, "scheduled", scheduledFor, caption, hashtags, platform);
  };

  const selectedPlatformLabel = PLATFORM_OPTIONS.find(p => p.value === platform)?.label || "Select Platform";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} style={styles.closeButton} disabled={isUpdating}>
            <Feather name="x" size={24} color={AppColors.primaryText} />
          </Pressable>
          <ThemedText type="h3" style={styles.modalTitle}>Upload Details</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <Image source={{ uri: upload.thumbnail || upload.uri }} style={styles.modalImage} />

          <View style={styles.modalSection}>
            <View style={styles.sectionHeader}>
              <Feather name="user" size={16} color={AppColors.orangePrimary} />
              <ThemedText style={styles.sectionTitle}>From</ThemedText>
            </View>
            <ThemedText style={styles.clientNameText}>{clientName}</ThemedText>
          </View>

          <View style={styles.modalSection}>
            <View style={styles.sectionHeader}>
              <Feather name="message-circle" size={16} color={AppColors.orangePrimary} />
              <ThemedText style={styles.sectionTitle}>Client Notes</ThemedText>
            </View>
            {upload.clientNotes ? (
              <View style={styles.notesBox}>
                <ThemedText style={styles.notesText}>{upload.clientNotes}</ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.noNotesText}>No notes provided by client</ThemedText>
            )}
          </View>

          <View style={styles.modalSection}>
            <View style={styles.sectionHeader}>
              <Feather name="clock" size={16} color={AppColors.orangePrimary} />
              <ThemedText style={styles.sectionTitle}>Uploaded</ThemedText>
            </View>
            <ThemedText style={styles.dateText}>
              {upload.uploadedAt ? new Date(upload.uploadedAt).toLocaleDateString() + " at " + new Date(upload.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Unknown"}
            </ThemedText>
          </View>

          <View style={styles.divider} />

          <View style={styles.scheduleSection}>
            <View style={[styles.actionButton, { marginBottom: Spacing.md }]}>
              <View style={[styles.actionIcon, { backgroundColor: "#E3F2FD" }]}>
                <Feather name="calendar" size={20} color="#1565C0" />
              </View>
              <View style={styles.actionContent}>
                <ThemedText style={styles.actionLabel}>Schedule Post</ThemedText>
                <ThemedText style={styles.actionDescription}>Add content and schedule</ThemedText>
              </View>
            </View>

            <View style={styles.fullInputGroup}>
              <ThemedText style={styles.inputLabel}>Platform</ThemedText>
              <Pressable 
                style={styles.platformSelector}
                onPress={() => setShowPlatformPicker(!showPlatformPicker)}
              >
                <ThemedText style={[styles.platformText, !platform && styles.placeholderText]}>
                  {selectedPlatformLabel}
                </ThemedText>
                <Feather name="chevron-down" size={18} color={AppColors.secondaryText} />
              </Pressable>
              {showPlatformPicker ? (
                <View style={styles.platformDropdown}>
                  {PLATFORM_OPTIONS.filter(p => p.value !== "").map((option) => (
                    <Pressable
                      key={option.value}
                      style={[styles.platformOption, platform === option.value && styles.platformOptionSelected]}
                      onPress={() => {
                        setPlatform(option.value);
                        setShowPlatformPicker(false);
                      }}
                    >
                      <ThemedText style={[styles.platformOptionText, platform === option.value && styles.platformOptionTextSelected]}>
                        {option.label}
                      </ThemedText>
                      {platform === option.value ? (
                        <Feather name="check" size={16} color={AppColors.orangePrimary} />
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.fullInputGroup}>
              <ThemedText style={styles.inputLabel}>Caption</ThemedText>
              <TextInput
                style={styles.captionInput}
                placeholder="Write your post caption..."
                placeholderTextColor={AppColors.tertiaryText}
                value={caption}
                onChangeText={setCaption}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.fullInputGroup}>
              <ThemedText style={styles.inputLabel}>Hashtags</ThemedText>
              <TextInput
                style={styles.scheduleInput}
                placeholder="#marketing #social #content"
                placeholderTextColor={AppColors.tertiaryText}
                value={hashtags}
                onChangeText={setHashtags}
              />
            </View>

            <View style={styles.scheduleInputs}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Date</ThemedText>
                <TextInput
                  style={styles.scheduleInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={AppColors.tertiaryText}
                  value={scheduledDate}
                  onChangeText={setScheduledDate}
                />
              </View>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Time</ThemedText>
                <TextInput
                  style={styles.scheduleInput}
                  placeholder="HH:MM"
                  placeholderTextColor={AppColors.tertiaryText}
                  value={scheduledTime}
                  onChangeText={setScheduledTime}
                />
              </View>
            </View>

            <Pressable 
              style={[styles.scheduleButton, (!scheduledDate || !scheduledTime || !platform || isUpdating) && styles.scheduleButtonDisabled]} 
              onPress={handleSchedule}
              disabled={!scheduledDate || !scheduledTime || !platform || isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color={AppColors.white} />
              ) : (
                <>
                  <Feather name="check" size={18} color={AppColors.white} />
                  <ThemedText style={styles.scheduleButtonText}>Schedule This Post</ThemedText>
                </>
              )}
            </Pressable>

            <ThemedText style={styles.scheduleNote}>
              Scheduled posts are automatically removed 48 hours after the scheduled time.
            </ThemedText>
          </View>

          <View style={styles.divider} />

          <View style={styles.deleteSection}>
            <ThemedText style={styles.deleteSectionTitle}>Remove Upload</ThemedText>
            <ThemedText style={styles.deleteSectionText}>
              Delete this upload if it's a duplicate or no longer needed.
            </ThemedText>
            
            {showDeleteConfirm ? (
              <View style={styles.deleteConfirmBox}>
                <ThemedText style={styles.deleteConfirmText}>
                  Are you sure you want to delete this upload? This cannot be undone.
                </ThemedText>
                <View style={styles.deleteConfirmButtons}>
                  <Pressable 
                    style={styles.cancelButton}
                    onPress={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                  </Pressable>
                  <Pressable 
                    style={[styles.confirmDeleteButton, isDeleting && styles.deleteButtonDisabled]}
                    onPress={() => onDelete(upload.id)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color={AppColors.white} />
                    ) : (
                      <ThemedText style={styles.confirmDeleteButtonText}>Yes, Delete</ThemedText>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable 
                style={styles.deleteButton} 
                onPress={() => setShowDeleteConfirm(true)}
              >
                <Feather name="trash-2" size={18} color={AppColors.white} />
                <ThemedText style={styles.deleteButtonText}>Delete Upload</ThemedText>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function AdminUploadsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  
  const [selectedClient, setSelectedClient] = useState<ClientUploadGroup | null>(null);
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { data: uploadGroups = [], isLoading, refetch } = useQuery<ClientUploadGroup[]>({
    queryKey: ["/api/uploads"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, scheduledFor, caption, hashtags, platform }: { id: string; status: string; scheduledFor?: string; caption?: string; hashtags?: string; platform?: string }) => {
      return apiRequest("PATCH", `/api/uploads/${id}`, { status, scheduledFor, caption, hashtags, platform });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setModalVisible(false);
      setSelectedUpload(null);
      Alert.alert("Success", "Post scheduled successfully.");
    },
    onError: () => {
      Alert.alert("Error", "Failed to schedule post. Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/uploads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setModalVisible(false);
      setSelectedUpload(null);
      Alert.alert("Deleted", "Upload has been removed.");
    },
    onError: () => {
      Alert.alert("Error", "Failed to delete upload. Please try again.");
    },
  });

  const handleDelete = useCallback((uploadId: string) => {
    deleteMutation.mutate(uploadId);
  }, [deleteMutation]);

  const handleUpdateStatus = useCallback((uploadId: string, status: string, scheduledFor?: string, caption?: string, hashtags?: string, platform?: string) => {
    updateMutation.mutate({ id: uploadId, status, scheduledFor, caption, hashtags, platform });
  }, [updateMutation]);

  const uploadMutation = useMutation({
    mutationFn: async ({ clientId, uri, type }: { clientId: string; uri: string; type: string }) => {
      return apiRequest("POST", "/api/uploads", {
        clientId,
        type,
        uri,
        clientNotes: "Uploaded by admin",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      Alert.alert("Success", "Content uploaded successfully.");
    },
    onError: () => {
      Alert.alert("Error", "Failed to upload content. Please try again.");
    },
  });

  const handleUploadForClient = async (clientId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const type = asset.type === "video" ? "video" : "image";
      uploadMutation.mutate({ clientId, uri: asset.uri, type });
    }
  };

  const openUploadDetail = (upload: Upload) => {
    setSelectedUpload(upload);
    setModalVisible(true);
  };

  // Sort clients: those with new uploads first, then by name
  const sortedUploadGroups = [...uploadGroups].sort((a, b) => {
    const aNewCount = a.uploads.filter(u => u.status === "new").length;
    const bNewCount = b.uploads.filter(u => u.status === "new").length;
    if (aNewCount > 0 && bNewCount === 0) return -1;
    if (bNewCount > 0 && aNewCount === 0) return 1;
    return a.client.name.localeCompare(b.client.name);
  });

  const totalNewUploads = uploadGroups.reduce((acc, g) => acc + g.uploads.filter(u => u.status === "new").length, 0);

  if (selectedClient) {
    const currentGroup = uploadGroups.find(g => g.client.id === selectedClient.client.id);
    const clientAllUploads = currentGroup?.uploads || [];
    const clientNewUploads = clientAllUploads.filter(u => u.status === "new");

    const getStatusText = () => {
      if (clientAllUploads.length === 0) return "No uploads yet";
      if (clientNewUploads.length > 0) return `${clientNewUploads.length} new upload${clientNewUploads.length !== 1 ? "s" : ""}`;
      return "All uploads scheduled";
    };

    const getHintText = () => {
      if (clientAllUploads.length === 0) return "Upload content for this client using the button below";
      if (clientNewUploads.length > 0) return "Tap an upload to schedule it";
      return "All uploads have been scheduled";
    };

    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <FlatList
          key="detail-grid"
          data={clientAllUploads}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={{
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
            paddingHorizontal: Spacing.lg,
          }}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          ListHeaderComponent={
            <View style={styles.detailHeader}>
              <Pressable style={styles.backButton} onPress={() => setSelectedClient(null)}>
                <Feather name="arrow-left" size={20} color={AppColors.orangePrimary} />
                <ThemedText style={styles.backText}>All Clients</ThemedText>
              </Pressable>
              <View style={styles.clientDetailHeader}>
                <View style={styles.clientAvatarLarge}>
                  <ThemedText style={styles.clientAvatarTextLarge}>{selectedClient.client.avatar}</ThemedText>
                </View>
                <ThemedText type="h2" style={styles.clientDetailName}>{selectedClient.client.name}</ThemedText>
                <ThemedText style={styles.clientDetailCount}>{getStatusText()}</ThemedText>
              </View>
              <ThemedText style={styles.tapHint}>{getHintText()}</ThemedText>
              
              <Pressable 
                style={[styles.uploadButton, uploadMutation.isPending && styles.uploadButtonDisabled]}
                onPress={() => handleUploadForClient(selectedClient.client.id)}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <ActivityIndicator size="small" color={AppColors.white} />
                ) : (
                  <>
                    <Feather name="plus" size={18} color={AppColors.white} />
                    <ThemedText style={styles.uploadButtonText}>Upload Content</ThemedText>
                  </>
                )}
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.uploadDetailItem} onPress={() => openUploadDetail(item)}>
              <Image 
                source={{ uri: item.thumbnail || item.uri }} 
                style={[
                  styles.uploadDetailImage, 
                  item.status === "scheduled" && styles.scheduledImage
                ]} 
              />
              {item.status === "scheduled" ? (
                <View style={styles.scheduledOverlay}>
                  <View style={styles.scheduledBadge}>
                    <Feather name="check-circle" size={16} color={AppColors.white} />
                    <ThemedText style={styles.scheduledText}>Scheduled</ThemedText>
                  </View>
                </View>
              ) : null}
              {item.type === "video" && item.status !== "scheduled" ? (
                <View style={styles.videoIndicatorLarge}>
                  <Feather name="play-circle" size={24} color={AppColors.white} />
                </View>
              ) : null}
              {item.clientNotes && item.status !== "scheduled" ? (
                <View style={styles.hasNotesIndicator}>
                  <Feather name="message-circle" size={12} color={AppColors.white} />
                  <ThemedText style={styles.hasNotesText}>Has notes</ThemedText>
                </View>
              ) : null}
              <View style={styles.uploadDetailInfo}>
                <ThemedText style={styles.uploadDate}>
                  {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString() : "Unknown"}
                </ThemedText>
              </View>
            </Pressable>
          )}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />

        <UploadDetailModal
          visible={modalVisible}
          upload={selectedUpload}
          clientName={selectedClient.client.name}
          onClose={() => {
            setModalVisible(false);
            setSelectedUpload(null);
          }}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDelete}
          isUpdating={updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={AppColors.orangePrimary} />
        <ThemedText style={styles.loadingText}>Loading uploads...</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        key="client-list"
        data={sortedUploadGroups}
        keyExtractor={item => item.client.id}
        renderItem={({ item, index }) => (
          <ClientUploadCard 
            client={item.client}
            uploads={item.uploads}
            index={index} 
            onPress={() => setSelectedClient(item)}
          />
        )}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor={AppColors.orangePrimary} />
        }
        ListHeaderComponent={
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryValue}>{totalNewUploads}</ThemedText>
              <ThemedText style={styles.summaryLabel}>New Uploads</ThemedText>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryValue}>{sortedUploadGroups.length}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Clients</ThemedText>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="inbox" size={48} color={AppColors.tertiaryText} />
            </View>
            <ThemedText type="h3" style={styles.emptyTitle}>All caught up!</ThemedText>
            <ThemedText style={styles.emptyText}>No new uploads to review</ThemedText>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.lg,
    color: AppColors.secondaryText,
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    color: AppColors.orangePrimary,
  },
  summaryLabel: {
    fontSize: 12,
    color: AppColors.secondaryText,
    marginTop: Spacing.xs,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: AppColors.neutral,
  },
  clientCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  clientAvatarText: {
    color: AppColors.orangePrimary,
    fontWeight: "700",
    fontSize: 18,
  },
  clientAvatarEmpty: {
    backgroundColor: AppColors.neutral,
  },
  clientAvatarTextEmpty: {
    color: AppColors.tertiaryText,
  },
  noUploadsText: {
    color: AppColors.tertiaryText,
    fontStyle: "italic",
  },
  noUploadsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.md,
  },
  noUploadsHint: {
    color: AppColors.tertiaryText,
    fontSize: 13,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    color: AppColors.primaryText,
    marginBottom: 2,
  },
  uploadCount: {
    color: AppColors.secondaryText,
    fontSize: 13,
  },
  uploadsPreview: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  previewItem: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  notesIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: AppColors.orangePrimary,
    borderRadius: BorderRadius.full,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  moreIndicator: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: {
    color: AppColors.orangePrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  detailHeader: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  backText: {
    color: AppColors.orangePrimary,
    fontWeight: "600",
  },
  clientDetailHeader: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  clientAvatarLarge: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  clientAvatarTextLarge: {
    color: AppColors.orangePrimary,
    fontWeight: "700",
    fontSize: 28,
  },
  clientDetailName: {
    color: AppColors.primaryText,
    marginBottom: Spacing.xs,
  },
  clientDetailCount: {
    color: AppColors.secondaryText,
  },
  tapHint: {
    textAlign: "center",
    color: AppColors.tertiaryText,
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  columnWrapper: {
    gap: Spacing.md,
  },
  uploadDetailItem: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  uploadDetailImage: {
    width: "100%",
    height: 120,
  },
  scheduledImage: {
    opacity: 0.4,
  },
  scheduledOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  scheduledBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  scheduledText: {
    color: AppColors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  videoIndicatorLarge: {
    position: "absolute",
    top: 48,
    left: "50%",
    marginLeft: -12,
  },
  hasNotesIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: AppColors.orangePrimary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hasNotesText: {
    color: AppColors.white,
    fontSize: 10,
    fontWeight: "600",
  },
  uploadDetailInfo: {
    padding: Spacing.md,
  },
  uploadDate: {
    color: AppColors.secondaryText,
    fontSize: 11,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    color: AppColors.primaryText,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    color: AppColors.secondaryText,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral,
    backgroundColor: AppColors.white,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    color: AppColors.primaryText,
  },
  modalContent: {
    padding: Spacing.lg,
  },
  modalImage: {
    width: "100%",
    height: 250,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  modalSection: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: AppColors.secondaryText,
    fontWeight: "600",
    fontSize: 13,
    textTransform: "uppercase",
  },
  clientNameText: {
    color: AppColors.primaryText,
    fontSize: 16,
    fontWeight: "600",
  },
  notesBox: {
    backgroundColor: AppColors.softCream,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.orangePrimary,
  },
  notesText: {
    color: AppColors.primaryText,
    fontSize: 14,
    lineHeight: 20,
  },
  noNotesText: {
    color: AppColors.tertiaryText,
    fontStyle: "italic",
  },
  dateText: {
    color: AppColors.primaryText,
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.neutral,
    marginVertical: Spacing.xl,
  },
  actionTitle: {
    color: AppColors.primaryText,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    color: AppColors.primaryText,
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 2,
  },
  actionDescription: {
    color: AppColors.secondaryText,
    fontSize: 13,
  },
  scheduleSection: {
    marginTop: Spacing.md,
  },
  scheduleInputs: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    color: AppColors.secondaryText,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  scheduleInput: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: AppColors.primaryText,
    borderWidth: 1,
    borderColor: AppColors.neutral,
  },
  scheduleButton: {
    backgroundColor: "#1565C0",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  scheduleButtonDisabled: {
    backgroundColor: AppColors.tertiaryText,
  },
  scheduleButtonText: {
    color: AppColors.white,
    fontWeight: "700",
    fontSize: 15,
  },
  scheduleNote: {
    color: AppColors.tertiaryText,
    fontSize: 12,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  fullInputGroup: {
    marginBottom: Spacing.lg,
  },
  captionInput: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: AppColors.primaryText,
    borderWidth: 1,
    borderColor: AppColors.neutral,
    minHeight: 100,
  },
  platformSelector: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: AppColors.neutral,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  platformText: {
    fontSize: 15,
    color: AppColors.primaryText,
  },
  placeholderText: {
    color: AppColors.tertiaryText,
  },
  platformDropdown: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: AppColors.neutral,
    overflow: "hidden",
  },
  platformOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral,
  },
  platformOptionSelected: {
    backgroundColor: AppColors.softCream,
  },
  platformOptionText: {
    fontSize: 15,
    color: AppColors.primaryText,
  },
  platformOptionTextSelected: {
    color: AppColors.orangePrimary,
    fontWeight: "600",
  },
  deleteSection: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: "#FFF5F5",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  deleteSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#C62828",
    marginBottom: Spacing.xs,
  },
  deleteSectionText: {
    fontSize: 13,
    color: AppColors.secondaryText,
    marginBottom: Spacing.md,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D32F2F",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: AppColors.white,
    fontWeight: "600",
    fontSize: 15,
  },
  deleteConfirmBox: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  deleteConfirmText: {
    fontSize: 14,
    color: AppColors.primaryText,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  deleteConfirmButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.neutral,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
  },
  cancelButtonText: {
    color: AppColors.primaryText,
    fontWeight: "600",
    fontSize: 14,
  },
  confirmDeleteButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D32F2F",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
  },
  confirmDeleteButtonText: {
    color: AppColors.white,
    fontWeight: "600",
    fontSize: 14,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.orangePrimary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: AppColors.white,
    fontWeight: "600",
    fontSize: 15,
  },
});
