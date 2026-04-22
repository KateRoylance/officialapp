import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Platform,
  Linking,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, AppColors, Shadows } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";

interface Upload {
  id: string;
  uri: string;
  type: "image" | "video";
  date: Date;
  status: "processing" | "ready" | "sent";
  notes: string;
}

interface PendingUpload {
  uri: string;
  type: "image" | "video";
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function UploadCard({ upload, index, onDelete }: { upload: Upload; index: number; onDelete: (id: string) => void }) {
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (upload.status === "processing") {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [upload.status]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleDelete = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDelete(upload.id);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(400)}
      style={styles.uploadCardWrapper}
    >
      <AnimatedPressable
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[styles.uploadCard, Shadows.card, cardStyle]}
        testID={`card-upload-${upload.id}`}
      >
        <Image source={{ uri: upload.uri }} style={styles.uploadThumbnail} />
        {upload.type === "video" ? (
          <View style={styles.videoOverlay}>
            <Feather name="play-circle" size={32} color={AppColors.white} />
          </View>
        ) : null}
        <Pressable 
          onPress={handleDelete} 
          style={styles.deleteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="trash-2" size={16} color={AppColors.white} />
        </Pressable>
        <View style={styles.uploadInfo}>
          <ThemedText style={styles.uploadDate}>{formatDate(upload.date)}</ThemedText>
          {upload.notes ? (
            <ThemedText style={styles.uploadNotes} numberOfLines={2}>{upload.notes}</ThemedText>
          ) : null}
          <Animated.View 
            style={[
              styles.statusBadge, 
              upload.status === "sent" ? styles.statusSent : upload.status === "ready" ? styles.statusReady : styles.statusProcessing,
              upload.status === "processing" ? pulseStyle : undefined,
            ]}
          >
            {upload.status === "processing" ? (
              <ActivityIndicator size="small" color={AppColors.orangePrimary} style={{ marginRight: 4 }} />
            ) : (
              <Feather 
                name={upload.status === "sent" ? "send" : "check-circle"} 
                size={12} 
                color={upload.status === "sent" ? "#1565C0" : AppColors.success} 
                style={{ marginRight: 4 }} 
              />
            )}
            <ThemedText style={[
              styles.statusText, 
              upload.status === "ready" && styles.statusTextReady,
              upload.status === "sent" && styles.statusTextSent,
            ]}>
              {upload.status === "processing" ? "Processing" : upload.status === "sent" ? "Sent to Team" : "Ready"}
            </ThemedText>
          </Animated.View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Image
        source={require("../../assets/images/empty-uploads.png")}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <ThemedText type="h4" style={styles.emptyTitle}>No Uploads Yet</ThemedText>
      <ThemedText style={styles.emptyText}>
        Tap the button below to upload your first photo or video
      </ThemedText>
      <Pressable onPress={onUpload} style={styles.emptyButton}>
        <LinearGradient
          colors={[AppColors.orangePrimary, AppColors.orangeLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.emptyButtonGradient}
        >
          <Feather name="upload" size={20} color={AppColors.white} />
          <ThemedText style={styles.emptyButtonText}>Upload Content</ThemedText>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export default function UploadScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [uploads, setUploads] = useState<Upload[]>([]);
  const [permission, requestPermission] = ImagePicker.useMediaLibraryPermissions();
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [uploadNotes, setUploadNotes] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [uploadToDelete, setUploadToDelete] = useState<string | null>(null);

  const fabScale = useSharedValue(1);

  const handleSelectMedia = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!permission?.granted) {
      if (permission?.status === "denied" && !permission?.canAskAgain) {
        if (Platform.OS !== "web") {
          try {
            await Linking.openSettings();
          } catch (error) {
            console.log("Cannot open settings");
          }
        }
        return;
      }
      const result = await requestPermission();
      if (!result.granted) return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets.length > 0) {
      const pending: PendingUpload[] = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type === "video" ? "video" : "image",
      }));
      setPendingUploads(pending);
      setUploadNotes("");
      setNotesModalVisible(true);
    }
  };

  const handleConfirmUpload = async () => {
    if (!user) return;
    
    setIsSending(true);
    
    const newUploads: Upload[] = pendingUploads.map((pending, i) => ({
      id: `${Date.now()}-${i}`,
      uri: pending.uri,
      type: pending.type,
      date: new Date(),
      status: "processing" as const,
      notes: uploadNotes.trim(),
    }));

    setUploads(prev => [...newUploads, ...prev]);
    setNotesModalVisible(false);
    setPendingUploads([]);
    const notesToSend = uploadNotes.trim();
    setUploadNotes("");

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Send each upload to the server
    for (const pending of pendingUploads) {
      try {
        await apiRequest("POST", "/api/uploads", {
          clientId: user.id,
          type: pending.type,
          uri: pending.uri,
          thumbnail: pending.uri,
          caption: null,
          clientNotes: notesToSend || null,
        });
      } catch (error) {
        console.log("Failed to send upload:", error);
      }
    }

    // Mark as sent after sending to server
    setTimeout(() => {
      setUploads(prev =>
        prev.map(upload =>
          newUploads.find(n => n.id === upload.id)
            ? { ...upload, status: "sent" as const }
            : upload
        )
      );
      setIsSending(false);
    }, 1500);
  };

  const handleCancelUpload = () => {
    setNotesModalVisible(false);
    setPendingUploads([]);
    setUploadNotes("");
  };

  const handleDeleteRequest = (uploadId: string) => {
    setUploadToDelete(uploadId);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = () => {
    if (uploadToDelete) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setUploads(prev => prev.filter(u => u.id !== uploadToDelete));
      setUploadToDelete(null);
      setDeleteModalVisible(false);
    }
  };

  const handleCancelDelete = () => {
    setUploadToDelete(null);
    setDeleteModalVisible(false);
  };

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={uploads}
        keyExtractor={item => item.id}
        numColumns={2}
        renderItem={({ item, index }) => <UploadCard upload={item} index={index} onDelete={handleDeleteRequest} />}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl + 80,
          paddingHorizontal: Spacing.md,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        columnWrapperStyle={uploads.length > 0 ? styles.row : undefined}
        ListHeaderComponent={
          uploads.length > 0 ? (
            <Animated.View entering={FadeIn.duration(400)} style={styles.headerSection}>
              <ThemedText type="h4" style={styles.sectionTitle}>Recent Uploads</ThemedText>
              <ThemedText style={styles.uploadCount}>{uploads.length} items</ThemedText>
            </Animated.View>
          ) : null
        }
        ListEmptyComponent={<EmptyState onUpload={handleSelectMedia} />}
        showsVerticalScrollIndicator={false}
      />

      {uploads.length > 0 ? (
        <AnimatedPressable
          onPress={handleSelectMedia}
          onPressIn={() => { fabScale.value = withSpring(0.9); }}
          onPressOut={() => { fabScale.value = withSpring(1); }}
          style={[
            styles.fab, 
            fabStyle, 
            Shadows.fab,
            { bottom: tabBarHeight + Spacing.xl }
          ]}
          testID="button-upload"
        >
          <LinearGradient
            colors={[AppColors.orangePrimary, AppColors.orangeLight]}
            style={styles.fabGradient}
          >
            <Feather name="plus" size={28} color={AppColors.white} />
          </LinearGradient>
        </AnimatedPressable>
      ) : null}

      <Modal
        visible={notesModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelUpload}
      >
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={handleCancelUpload} style={styles.modalHeaderButton}>
              <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
            </Pressable>
            <ThemedText type="h4" style={styles.modalTitle}>Add Notes</ThemedText>
            <Pressable onPress={handleConfirmUpload} style={styles.modalHeaderButton}>
              <ThemedText style={styles.modalUploadText}>Upload</ThemedText>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.previewSection}>
              <ThemedText style={styles.previewLabel}>
                {pendingUploads.length} {pendingUploads.length === 1 ? "file" : "files"} selected
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
                {pendingUploads.map((item, index) => (
                  <View key={index} style={styles.previewItem}>
                    <Image source={{ uri: item.uri }} style={styles.previewImage} />
                    {item.type === "video" ? (
                      <View style={styles.previewVideoOverlay}>
                        <Feather name="play" size={16} color={AppColors.white} />
                      </View>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.notesSection}>
              <ThemedText style={styles.notesLabel}>Notes for your marketing team</ThemedText>
              <ThemedText style={styles.notesHint}>
                Add any details about these uploads - context, preferences, or special instructions
              </ThemedText>
              <TextInput
                style={styles.notesInput}
                placeholder="e.g., This is from our latest event, would love a vibrant caption..."
                placeholderTextColor={AppColors.tertiaryText}
                value={uploadNotes}
                onChangeText={setUploadNotes}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                testID="input-upload-notes"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.deleteModalOverlay}>
          <Animated.View entering={FadeIn.duration(200)} style={[styles.deleteModalContent, Shadows.card]}>
            <View style={styles.deleteIconContainer}>
              <Feather name="trash-2" size={32} color={AppColors.error} />
            </View>
            <ThemedText style={styles.deleteModalTitle}>Delete Upload?</ThemedText>
            <ThemedText style={styles.deleteModalText}>
              Are you sure you want to delete this upload? This action cannot be undone.
            </ThemedText>
            <View style={styles.deleteModalButtons}>
              <Pressable onPress={handleCancelDelete} style={styles.deleteCancelButton}>
                <ThemedText style={styles.deleteCancelButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable onPress={handleConfirmDelete} style={styles.deleteConfirmButton}>
                <ThemedText style={styles.deleteConfirmButtonText}>Delete</ThemedText>
              </Pressable>
            </View>
          </Animated.View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    color: AppColors.primaryText,
  },
  uploadCount: {
    color: AppColors.secondaryText,
    fontSize: 14,
  },
  row: {
    justifyContent: "space-between",
  },
  uploadCardWrapper: {
    width: "48%",
    marginBottom: Spacing.md,
  },
  uploadCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  uploadThumbnail: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: AppColors.neutral,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadInfo: {
    padding: Spacing.md,
  },
  uploadDate: {
    fontSize: 12,
    color: AppColors.secondaryText,
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  statusProcessing: {
    backgroundColor: AppColors.softCream,
  },
  statusReady: {
    backgroundColor: "#E8F5E9",
  },
  statusSent: {
    backgroundColor: "#E3F2FD",
  },
  statusText: {
    fontSize: 11,
    color: AppColors.orangePrimary,
    fontWeight: "500",
  },
  statusTextReady: {
    color: AppColors.success,
  },
  statusTextSent: {
    color: "#1565C0",
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
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  emptyButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  emptyButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
  fab: {
    position: "absolute",
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadNotes: {
    fontSize: 12,
    color: AppColors.secondaryText,
    marginBottom: Spacing.sm,
    lineHeight: 16,
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
  modalHeaderButton: {
    padding: Spacing.sm,
    minWidth: 70,
  },
  modalCancelText: {
    color: AppColors.secondaryText,
    fontSize: 16,
  },
  modalTitle: {
    color: AppColors.primaryText,
  },
  modalUploadText: {
    color: AppColors.orangePrimary,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "right",
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
  },
  previewSection: {
    marginBottom: Spacing.xl,
  },
  previewLabel: {
    fontSize: 14,
    color: AppColors.secondaryText,
    marginBottom: Spacing.md,
  },
  previewScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  previewItem: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    marginRight: Spacing.sm,
    backgroundColor: AppColors.neutral,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  notesSection: {
    marginBottom: Spacing.lg,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.primaryText,
    marginBottom: Spacing.xs,
  },
  notesHint: {
    fontSize: 14,
    color: AppColors.secondaryText,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  notesInput: {
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: AppColors.primaryText,
    minHeight: 120,
    borderWidth: 1,
    borderColor: AppColors.neutral,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  deleteModalContent: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  deleteIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.primaryText,
    marginBottom: Spacing.sm,
  },
  deleteModalText: {
    fontSize: 14,
    color: AppColors.secondaryText,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  deleteCancelButton: {
    flex: 1,
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  deleteCancelButtonText: {
    color: AppColors.secondaryText,
    fontSize: 15,
    fontWeight: "600",
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: AppColors.error,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  deleteConfirmButtonText: {
    color: AppColors.white,
    fontSize: 15,
    fontWeight: "600",
  },
});
