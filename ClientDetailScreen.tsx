import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { AppColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { AdminStackParamList } from "@/navigation/types";
import { apiRequest, getApiUrl } from "@/lib/query-client";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<AdminStackParamList, "ClientDetail">;
type NavigationProp = NativeStackNavigationProp<AdminStackParamList>;

interface ClientDetail {
  id: string;
  email: string;
  businessName: string;
  businessType: string | null;
  notes: string | null;
  adminNotes: string | null;
  platforms: string | null;
  status: string;
  lastActiveAt: string | null;
  createdAt: string;
  pendingApproval: number;
  scheduledThisWeek: number;
  scheduledNextWeek: number;
  totalUploads: number;
}

const PLATFORM_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  instagram: { icon: "instagram", color: "#E4405F", label: "Instagram" },
  facebook: { icon: "facebook", color: "#1877F2", label: "Facebook" },
  tiktok: { icon: "music", color: "#000000", label: "TikTok" },
  twitter: { icon: "twitter", color: "#1DA1F2", label: "X/Twitter" },
  linkedin: { icon: "linkedin", color: "#0A66C2", label: "LinkedIn" },
};

function formatLastActive(dateStr: string | null): string {
  if (!dateStr) return "Never";
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ClientDetailScreen({ route }: Props) {
  const { clientId, clientName } = route.params;
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const navigation = useNavigation<NavigationProp>();
  
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailText, setEmailText] = useState("");
  const [showAddSupport, setShowAddSupport] = useState(false);
  const [supportEmail, setSupportEmail] = useState("");
  const [supportName, setSupportName] = useState("");

  const { data: client, isLoading, refetch, isRefetching } = useQuery<ClientDetail>({
    queryKey: ["/api/clients", clientId],
    queryFn: async () => {
      const res = await fetch(new URL(`/api/clients/${clientId}`, getApiUrl()).toString());
      if (!res.ok) throw new Error("Failed to fetch client");
      return res.json();
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async (adminNotes: string) => {
      return apiRequest("PATCH", `/api/clients/${clientId}`, { adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId] });
      setEditingNotes(false);
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest("PATCH", `/api/clients/${clientId}`, { email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setEditingEmail(false);
    },
  });

  interface SupportUserData {
    id: string;
    email: string;
    name: string | null;
    status: string;
    createdAt: string;
  }

  const { data: supportUsers = [] } = useQuery<SupportUserData[]>({
    queryKey: ["/api/clients", clientId, "support-users"],
    queryFn: async () => {
      const res = await fetch(new URL(`/api/clients/${clientId}/support-users`, getApiUrl()).toString());
      if (!res.ok) throw new Error("Failed to fetch support users");
      return res.json();
    },
  });

  const addSupportUserMutation = useMutation({
    mutationFn: async (data: { email: string; name: string }) => {
      return apiRequest("POST", `/api/clients/${clientId}/support-users`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "support-users"] });
      setShowAddSupport(false);
      setSupportEmail("");
      setSupportName("");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to add support user");
    },
  });

  const deleteSupportUserMutation = useMutation({
    mutationFn: async (supportUserId: string) => {
      return apiRequest("DELETE", `/api/support-users/${supportUserId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "support-users"] });
    },
  });

  const handleAddSupportUser = () => {
    if (supportEmail.trim() && supportEmail.includes("@")) {
      addSupportUserMutation.mutate({ email: supportEmail.trim(), name: supportName.trim() });
    }
  };

  const handleDeleteSupportUser = (supportUserId: string, email: string) => {
    Alert.alert(
      "Remove Support User",
      `Are you sure you want to remove ${email}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => deleteSupportUserMutation.mutate(supportUserId) },
      ]
    );
  };

  const handleEditEmail = () => {
    setEmailText(client?.email || "");
    setEditingEmail(true);
  };

  const handleSaveEmail = () => {
    if (emailText.trim() && emailText.includes("@")) {
      updateEmailMutation.mutate(emailText.trim());
    }
  };

  const handleCancelEmailEdit = () => {
    setEditingEmail(false);
    setEmailText("");
  };

  const handleEditNotes = () => {
    setNotesText(client?.adminNotes || "");
    setEditingNotes(true);
  };

  const handleSaveNotes = () => {
    updateNotesMutation.mutate(notesText);
  };

  const handleCancelEdit = () => {
    setEditingNotes(false);
    setNotesText("");
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={AppColors.orangePrimary} />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <Feather name="alert-circle" size={48} color={AppColors.tertiaryText} />
        <ThemedText style={styles.errorText}>Client not found</ThemedText>
      </View>
    );
  }

  const platforms = client.platforms?.split(",").filter(Boolean) || [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={AppColors.orangePrimary} />
      }
    >
      <View style={[styles.headerCard, Shadows.card]}>
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>{client.businessName.charAt(0)}</ThemedText>
        </View>
        <ThemedText type="h2" style={styles.businessName}>{client.businessName}</ThemedText>
        {editingEmail ? (
          <View style={styles.emailEditContainer}>
            <TextInput
              style={styles.emailInput}
              value={emailText}
              onChangeText={setEmailText}
              placeholder="Enter email address"
              placeholderTextColor={AppColors.tertiaryText}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.emailEditActions}>
              <Pressable style={styles.cancelButton} onPress={handleCancelEmailEdit}>
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.saveButton, (!emailText.trim() || !emailText.includes("@") || updateEmailMutation.isPending) && styles.saveButtonDisabled]}
                onPress={handleSaveEmail}
                disabled={!emailText.trim() || !emailText.includes("@") || updateEmailMutation.isPending}
              >
                {updateEmailMutation.isPending ? (
                  <ActivityIndicator size="small" color={AppColors.white} />
                ) : (
                  <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.emailRow} onPress={handleEditEmail}>
            <ThemedText style={styles.email}>{client.email}</ThemedText>
            <Feather name="edit-2" size={14} color={AppColors.orangePrimary} />
          </Pressable>
        )}
        {client.businessType ? (
          <View style={styles.businessTypeBadge}>
            <Feather name="briefcase" size={12} color={AppColors.orangePrimary} />
            <ThemedText style={styles.businessTypeText}>{client.businessType}</ThemedText>
          </View>
        ) : null}
      </View>

      <View style={[styles.section, Shadows.card]}>
        <View style={styles.sectionHeader}>
          <Feather name="share-2" size={18} color={AppColors.orangePrimary} />
          <ThemedText type="h4" style={styles.sectionTitle}>Platforms Managed</ThemedText>
        </View>
        <View style={styles.platformsRow}>
          {platforms.length > 0 ? platforms.map((platform) => {
            const config = PLATFORM_ICONS[platform] || { icon: "globe", color: "#666", label: platform };
            return (
              <View key={platform} style={styles.platformItem}>
                <View style={[styles.platformIcon, { backgroundColor: config.color + "15" }]}>
                  <Feather name={config.icon as any} size={20} color={config.color} />
                </View>
                <ThemedText style={styles.platformLabel}>{config.label}</ThemedText>
              </View>
            );
          }) : (
            <ThemedText style={styles.noDataText}>No platforms set</ThemedText>
          )}
        </View>
      </View>

      <View style={[styles.section, Shadows.card]}>
        <View style={styles.sectionHeader}>
          <Feather name="activity" size={18} color={AppColors.orangePrimary} />
          <ThemedText type="h4" style={styles.sectionTitle}>Activity</ThemedText>
        </View>
        <View style={styles.activityItem}>
          <Feather name="clock" size={16} color={AppColors.secondaryText} />
          <ThemedText style={styles.activityLabel}>Last Active:</ThemedText>
          <ThemedText style={styles.activityValue}>{formatLastActive(client.lastActiveAt)}</ThemedText>
        </View>
        <View style={styles.activityItem}>
          <Feather name="calendar" size={16} color={AppColors.secondaryText} />
          <ThemedText style={styles.activityLabel}>Client Since:</ThemedText>
          <ThemedText style={styles.activityValue}>
            {new Date(client.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.section, Shadows.card]}>
        <View style={styles.sectionHeader}>
          <Feather name="bar-chart-2" size={18} color={AppColors.orangePrimary} />
          <ThemedText type="h4" style={styles.sectionTitle}>Content Stats</ThemedText>
        </View>
        <View style={styles.statsGrid}>
          <Pressable 
            style={styles.statBox}
            onPress={() => navigation.navigate("PendingApprovals", { clientId, clientName })}
          >
            <ThemedText style={styles.statNumber}>{client.pendingApproval}</ThemedText>
            <ThemedText style={styles.statLabel}>Pending Approval</ThemedText>
            <Feather name="chevron-right" size={16} color={AppColors.orangePrimary} style={styles.statArrow} />
          </Pressable>
          <View style={styles.statBox}>
            <ThemedText style={[styles.statNumber, { color: "#2196F3" }]}>{client.scheduledThisWeek}</ThemedText>
            <ThemedText style={styles.statLabel}>Scheduled This Week</ThemedText>
          </View>
          <View style={styles.statBox}>
            <ThemedText style={[styles.statNumber, { color: "#4CAF50" }]}>{client.scheduledNextWeek}</ThemedText>
            <ThemedText style={styles.statLabel}>Scheduled Next Week</ThemedText>
          </View>
          <View style={styles.statBox}>
            <ThemedText style={[styles.statNumber, { color: "#9C27B0" }]}>{client.totalUploads}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Uploads</ThemedText>
          </View>
        </View>
      </View>

      <View style={[styles.section, Shadows.card]}>
        <View style={styles.sectionHeader}>
          <Feather name="file-text" size={18} color={AppColors.orangePrimary} />
          <ThemedText type="h4" style={styles.sectionTitle}>Admin Notes</ThemedText>
          {!editingNotes ? (
            <Pressable style={styles.editButton} onPress={handleEditNotes}>
              <Feather name="edit-2" size={16} color={AppColors.orangePrimary} />
            </Pressable>
          ) : null}
        </View>
        
        {editingNotes ? (
          <View>
            <TextInput
              style={styles.notesInput}
              value={notesText}
              onChangeText={setNotesText}
              placeholder="Add notes about this client, their preferences, business goals, etc."
              placeholderTextColor={AppColors.tertiaryText}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <View style={styles.notesActions}>
              <Pressable style={styles.cancelButton} onPress={handleCancelEdit}>
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable 
                style={[styles.saveButton, updateNotesMutation.isPending && styles.saveButtonDisabled]} 
                onPress={handleSaveNotes}
                disabled={updateNotesMutation.isPending}
              >
                {updateNotesMutation.isPending ? (
                  <ActivityIndicator size="small" color={AppColors.white} />
                ) : (
                  <ThemedText style={styles.saveButtonText}>Save Notes</ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <ThemedText style={client.adminNotes ? styles.notesText : styles.noDataText}>
            {client.adminNotes || "No notes added yet. Tap the edit icon to add notes about this client."}
          </ThemedText>
        )}
      </View>

      <View style={[styles.section, Shadows.card]}>
        <View style={styles.sectionHeader}>
          <Feather name="users" size={18} color={AppColors.orangePrimary} />
          <ThemedText type="h4" style={styles.sectionTitle}>Support Users</ThemedText>
          <Pressable style={styles.editButton} onPress={() => setShowAddSupport(!showAddSupport)}>
            <Feather name={showAddSupport ? "x" : "plus"} size={18} color={AppColors.orangePrimary} />
          </Pressable>
        </View>

        <ThemedText style={styles.supportInfoText}>
          Support users can only access Ideas and Uploads.
        </ThemedText>

        {showAddSupport ? (
          <View style={styles.addSupportForm}>
            <TextInput
              style={styles.supportInput}
              placeholder="Name"
              placeholderTextColor={AppColors.tertiaryText}
              value={supportName}
              onChangeText={setSupportName}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.supportInput}
              placeholder="Email address"
              placeholderTextColor={AppColors.tertiaryText}
              value={supportEmail}
              onChangeText={setSupportEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.supportFormActions}>
              <Pressable style={styles.cancelButton} onPress={() => { setShowAddSupport(false); setSupportEmail(""); setSupportName(""); }}>
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.saveButton, (!supportEmail.trim() || !supportEmail.includes("@") || addSupportUserMutation.isPending) && styles.saveButtonDisabled]}
                onPress={handleAddSupportUser}
                disabled={!supportEmail.trim() || !supportEmail.includes("@") || addSupportUserMutation.isPending}
              >
                {addSupportUserMutation.isPending ? (
                  <ActivityIndicator size="small" color={AppColors.white} />
                ) : (
                  <ThemedText style={styles.saveButtonText}>Add</ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}

        {supportUsers.length > 0 ? supportUsers.map((su) => (
          <View key={su.id} style={styles.supportUserItem}>
            <View style={styles.supportUserIcon}>
              <Feather name="user" size={16} color={AppColors.orangePrimary} />
            </View>
            <View style={styles.supportUserInfo}>
              <ThemedText style={styles.supportUserName}>{su.name || su.email.split("@")[0]}</ThemedText>
              <ThemedText style={styles.supportUserEmail}>{su.email}</ThemedText>
            </View>
            <View style={[
              styles.supportStatusBadge,
              su.status === "active" ? styles.supportStatusActive : styles.supportStatusPending,
            ]}>
              <ThemedText style={[
                styles.supportStatusText,
                su.status === "active" ? styles.supportStatusTextActive : styles.supportStatusTextPending,
              ]}>
                {su.status === "active" ? "Active" : "Pending"}
              </ThemedText>
            </View>
            <Pressable style={styles.supportDeleteButton} onPress={() => handleDeleteSupportUser(su.id, su.email)}>
              <Feather name="trash-2" size={16} color={AppColors.error} />
            </Pressable>
          </View>
        )) : !showAddSupport ? (
          <ThemedText style={styles.noDataText}>
            No support users added yet. Tap the + icon to add one.
          </ThemedText>
        ) : null}
      </View>
    </ScrollView>
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
  errorText: {
    marginTop: Spacing.md,
    color: AppColors.secondaryText,
    fontSize: 16,
  },
  headerCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: AppColors.orangePrimary,
    fontWeight: "700",
    fontSize: 32,
  },
  businessName: {
    color: AppColors.primaryText,
    textAlign: "center",
  },
  email: {
    color: AppColors.secondaryText,
    fontSize: 14,
    marginTop: 4,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 4,
  },
  emailEditContainer: {
    width: "100%",
    marginTop: Spacing.sm,
  },
  emailInput: {
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: AppColors.primaryText,
    borderWidth: 1,
    borderColor: AppColors.orangePrimary,
    textAlign: "center",
  },
  emailEditActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  businessTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.softCream,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    gap: 6,
  },
  businessTypeText: {
    color: AppColors.orangePrimary,
    fontSize: 13,
    fontWeight: "500",
  },
  section: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    color: AppColors.primaryText,
    flex: 1,
  },
  platformsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
  },
  platformItem: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  platformLabel: {
    fontSize: 12,
    color: AppColors.secondaryText,
  },
  noDataText: {
    color: AppColors.tertiaryText,
    fontSize: 14,
    fontStyle: "italic",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  activityLabel: {
    color: AppColors.secondaryText,
    fontSize: 14,
  },
  activityValue: {
    color: AppColors.primaryText,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: "auto",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statBox: {
    width: "47%",
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: AppColors.orangePrimary,
    lineHeight: 38,
  },
  statLabel: {
    fontSize: 12,
    color: AppColors.secondaryText,
    marginTop: 6,
    textAlign: "center",
  },
  statArrow: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
  },
  editButton: {
    padding: Spacing.sm,
  },
  notesInput: {
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: AppColors.primaryText,
    minHeight: 120,
    borderWidth: 1,
    borderColor: AppColors.orangePrimary,
  },
  notesActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  cancelButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  cancelButtonText: {
    color: AppColors.secondaryText,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: AppColors.orangePrimary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    minWidth: 100,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: AppColors.white,
    fontWeight: "600",
  },
  notesText: {
    color: AppColors.primaryText,
    fontSize: 14,
    lineHeight: 22,
  },
  supportInfoText: {
    color: AppColors.secondaryText,
    fontSize: 13,
    marginBottom: Spacing.md,
    fontStyle: "italic",
  },
  addSupportForm: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  supportInput: {
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: AppColors.primaryText,
    borderWidth: 1,
    borderColor: AppColors.neutral,
  },
  supportFormActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  supportUserItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppColors.neutral,
    gap: Spacing.sm,
  },
  supportUserIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
  },
  supportUserInfo: {
    flex: 1,
  },
  supportUserName: {
    color: AppColors.primaryText,
    fontSize: 14,
    fontWeight: "600",
  },
  supportUserEmail: {
    color: AppColors.secondaryText,
    fontSize: 12,
    marginTop: 2,
  },
  supportStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  supportStatusActive: {
    backgroundColor: "#E8F5E9",
  },
  supportStatusPending: {
    backgroundColor: "#FFF3E0",
  },
  supportStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  supportStatusTextActive: {
    color: "#4CAF50",
  },
  supportStatusTextPending: {
    color: "#FF9800",
  },
  supportDeleteButton: {
    padding: Spacing.sm,
  },
});
