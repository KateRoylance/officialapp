import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { AppColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

const BUSINESS_TYPES = [
  "Food & Beverage",
  "Health & Wellness",
  "Retail",
  "Technology",
  "Fashion",
  "Services",
  "Other",
];

const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "instagram" as const, color: "#E4405F" },
  { id: "facebook", label: "Facebook", icon: "facebook" as const, color: "#1877F2" },
  { id: "tiktok", label: "TikTok", icon: "music" as const, color: "#000000" },
];

export default function AddClientScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [notes, setNotes] = useState("");
  const [showBusinessTypes, setShowBusinessTypes] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedEmail, setSavedEmail] = useState("");

  const createClientMutation = useMutation({
    mutationFn: async (data: {
      businessName: string;
      email: string;
      businessType: string;
      notes: string;
      platforms: string;
    }) => {
      return apiRequest("POST", "/api/clients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSavedEmail(email);
      setShowSuccess(true);
      // Auto navigate back after 2.5 seconds
      setTimeout(() => {
        navigation.goBack();
      }, 2500);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to create client");
    },
  });

  const togglePlatform = (platformId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSave = () => {
    if (!businessName.trim()) {
      Alert.alert("Required Field", "Please enter a business name");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Required Field", "Please enter an email address");
      return;
    }
    if (selectedPlatforms.length === 0) {
      Alert.alert("Required Field", "Please select at least one social media platform");
      return;
    }

    createClientMutation.mutate({
      businessName: businessName.trim(),
      email: email.trim().toLowerCase(),
      businessType,
      notes,
      platforms: selectedPlatforms.join(","),
    });
  };

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
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.formCard, Shadows.card]}>
          <View style={styles.formHeader}>
            <View style={styles.iconWrapper}>
              <Feather name="user-plus" size={24} color={AppColors.orangePrimary} />
            </View>
            <ThemedText type="h3" style={styles.formTitle}>New Client</ThemedText>
            <ThemedText style={styles.formSubtitle}>
              Enter the client's details to enroll them
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Business Name *</ThemedText>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Enter business name"
              placeholderTextColor={AppColors.tertiaryText}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email Address *</ThemedText>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="client@example.com"
              placeholderTextColor={AppColors.tertiaryText}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Phone Number</ThemedText>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              placeholderTextColor={AppColors.tertiaryText}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Business Type</ThemedText>
            <Pressable 
              style={styles.selectButton}
              onPress={() => setShowBusinessTypes(!showBusinessTypes)}
            >
              <ThemedText style={businessType ? styles.selectButtonText : styles.selectButtonPlaceholder}>
                {businessType || "Select business type"}
              </ThemedText>
              <Feather 
                name={showBusinessTypes ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={AppColors.secondaryText} 
              />
            </Pressable>
            {showBusinessTypes ? (
              <View style={styles.dropdownList}>
                {BUSINESS_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.dropdownItem, businessType === type && styles.dropdownItemActive]}
                    onPress={() => {
                      setBusinessType(type);
                      setShowBusinessTypes(false);
                    }}
                  >
                    <ThemedText style={[styles.dropdownItemText, businessType === type && styles.dropdownItemTextActive]}>
                      {type}
                    </ThemedText>
                    {businessType === type ? (
                      <Feather name="check" size={16} color={AppColors.orangePrimary} />
                    ) : null}
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Social Media Platforms *</ThemedText>
            <ThemedText style={styles.helperText}>
              Select the platforms this client uses
            </ThemedText>
            <View style={styles.platformsContainer}>
              {SOCIAL_PLATFORMS.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <Pressable
                    key={platform.id}
                    style={[
                      styles.platformChip,
                      isSelected && { backgroundColor: platform.color },
                    ]}
                    onPress={() => togglePlatform(platform.id)}
                  >
                    <Feather
                      name={isSelected ? "check-circle" : platform.icon}
                      size={18}
                      color={isSelected ? AppColors.white : platform.color}
                    />
                    <ThemedText
                      style={[
                        styles.platformLabel,
                        isSelected && styles.platformLabelSelected,
                      ]}
                    >
                      {platform.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Notes</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes about this client..."
              placeholderTextColor={AppColors.tertiaryText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <Pressable 
          style={[styles.saveButton, createClientMutation.isPending && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={createClientMutation.isPending}
        >
          {createClientMutation.isPending ? (
            <ActivityIndicator color={AppColors.white} size="small" />
          ) : (
            <>
              <Feather name="check" size={20} color={AppColors.white} />
              <ThemedText style={styles.saveButtonText}>Enroll Client</ThemedText>
            </>
          )}
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
        </Pressable>
      </ScrollView>

      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
      >
        <View style={styles.successOverlay}>
          <Animated.View 
            entering={ZoomIn.duration(300)}
            style={styles.successModal}
          >
            <Animated.View 
              entering={FadeIn.delay(200).duration(300)}
              style={styles.successIconWrapper}
            >
              <Feather name="check-circle" size={56} color="#4CAF50" />
            </Animated.View>
            <ThemedText type="h3" style={styles.successTitle}>Client Enrolled!</ThemedText>
            <ThemedText style={styles.successMessage}>
              An invitation has been sent to {savedEmail}
            </ThemedText>
            <ThemedText style={styles.successNote}>
              The link will expire in 48 hours
            </ThemedText>
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
  formCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  formHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  formTitle: {
    color: AppColors.primaryText,
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    color: AppColors.secondaryText,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: AppColors.primaryText,
    fontWeight: "600",
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  helperText: {
    color: AppColors.secondaryText,
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: 15,
    color: AppColors.primaryText,
    borderWidth: 1,
    borderColor: AppColors.neutral,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  selectButton: {
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: AppColors.neutral,
  },
  selectButtonText: {
    color: AppColors.primaryText,
    fontSize: 15,
  },
  selectButtonPlaceholder: {
    color: AppColors.tertiaryText,
    fontSize: 15,
  },
  dropdownList: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: AppColors.neutral,
    overflow: "hidden",
  },
  dropdownItem: {
    padding: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral,
  },
  dropdownItemActive: {
    backgroundColor: AppColors.softCream,
  },
  dropdownItemText: {
    color: AppColors.primaryText,
    fontSize: 15,
  },
  dropdownItemTextActive: {
    color: AppColors.orangePrimary,
    fontWeight: "600",
  },
  platformsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  platformChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.softCream,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  platformLabel: {
    color: AppColors.primaryText,
    fontSize: 14,
    fontWeight: "500",
  },
  platformLabelSelected: {
    color: AppColors.white,
  },
  saveButton: {
    backgroundColor: AppColors.orangePrimary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: AppColors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  cancelButtonText: {
    color: AppColors.secondaryText,
    fontWeight: "600",
    fontSize: 15,
  },
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  successModal: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl * 1.5,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  successIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  successTitle: {
    color: AppColors.primaryText,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  successMessage: {
    color: AppColors.secondaryText,
    fontSize: 15,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  successNote: {
    color: AppColors.tertiaryText,
    fontSize: 13,
    textAlign: "center",
  },
});
