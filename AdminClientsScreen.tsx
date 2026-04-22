import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { AppColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { AdminStackParamList } from "@/navigation/types";
import { apiRequest } from "@/lib/query-client";

interface Client {
  id: string;
  businessName: string;
  email: string;
  businessType: string | null;
  status: string;
  activityStatus: "active" | "inactive" | "pending";
  invitationExpiresAt: string | null;
  pendingCount: number;
  scheduledNextWeek: number;
  platforms: string | null;
  lastActiveAt: string | null;
}

function ClientCard({ 
  client, 
  index, 
  onViewDetails,
  onResendInvitation,
  onDeleteClient,
  isResending,
  isDeleting,
}: { 
  client: Client; 
  index: number;
  onViewDetails: (client: Client) => void;
  onResendInvitation: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
  isResending: boolean;
  isDeleting: boolean;
}) {
  const handleResendInvitation = () => {
    Alert.alert(
      "Resend Invitation?",
      `Do you want to resend the invitation to ${client.email}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Resend", 
          onPress: () => onResendInvitation(client)
        },
      ]
    );
  };

  const handleDeleteClient = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(`Are you sure you want to delete ${client.businessName}?`);
      if (confirmed) {
        const doubleConfirmed = window.confirm(`This will permanently remove ${client.businessName} and all their uploads. This action cannot be undone. Continue?`);
        if (doubleConfirmed) {
          onDeleteClient(client);
        }
      }
    } else {
      Alert.alert(
        "Delete Client?",
        `Are you sure you want to delete ${client.businessName}?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete", 
            style: "destructive",
            onPress: () => {
              Alert.alert(
                "Confirm Deletion",
                `This will permanently remove ${client.businessName} and all their uploads. This action cannot be undone.`,
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Yes, Delete", 
                    style: "destructive",
                    onPress: () => onDeleteClient(client)
                  },
                ]
              );
            }
          },
        ]
      );
    }
  };

  const getStatusStyle = () => {
    switch (client.activityStatus) {
      case "active":
        return styles.statusActive;
      case "pending":
        return styles.statusPending;
      default:
        return styles.statusInactive;
    }
  };

  const getStatusLabel = () => {
    switch (client.activityStatus) {
      case "active":
        return "Active";
      case "pending":
        return "Pending";
      default:
        return "Inactive";
    }
  };

  const isPending = client.activityStatus === "pending";

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <Pressable 
        style={[styles.clientCard, Shadows.card]}
        onPress={() => !isPending && onViewDetails(client)}
      >
        <View style={styles.clientHeader}>
          <View style={[styles.clientAvatar, isPending && styles.clientAvatarPending]}>
            <ThemedText style={[styles.clientAvatarText, isPending && styles.clientAvatarTextPending]}>
              {client.businessName.charAt(0)}
            </ThemedText>
          </View>
          <View style={styles.clientInfo}>
            <ThemedText type="h4" style={styles.clientName}>{client.businessName}</ThemedText>
            <ThemedText style={styles.clientEmail}>{client.email}</ThemedText>
          </View>
          <View style={[styles.statusBadge, getStatusStyle()]}>
            <ThemedText style={[
              styles.statusText, 
              isPending && styles.statusTextPending,
              client.activityStatus === "inactive" && styles.statusTextInactive
            ]}>
              {getStatusLabel()}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.clientMeta}>
          {client.businessType ? (
            <View style={styles.metaItem}>
              <Feather name="briefcase" size={14} color={AppColors.secondaryText} />
              <ThemedText style={styles.metaText}>{client.businessType}</ThemedText>
            </View>
          ) : null}
          {client.platforms ? (
            <View style={[styles.metaItem, client.businessType ? { marginLeft: Spacing.lg } : {}]}>
              <Feather name="share-2" size={14} color={AppColors.secondaryText} />
              <ThemedText style={styles.metaText}>
                {client.platforms.split(",").length} platform{client.platforms.split(",").length !== 1 ? "s" : ""}
              </ThemedText>
            </View>
          ) : null}
        </View>

        {isPending ? (
          <View style={styles.invitationActions}>
            <Pressable 
              style={[styles.resendButton, isResending && { opacity: 0.6 }]} 
              onPress={handleResendInvitation}
              disabled={isResending}
            >
              {isResending ? (
                <ActivityIndicator size="small" color={AppColors.orangePrimary} />
              ) : (
                <Feather name="refresh-cw" size={14} color={AppColors.orangePrimary} />
              )}
              <ThemedText style={styles.resendButtonText}>
                {isResending ? "Sending..." : "Resend Invitation"}
              </ThemedText>
            </Pressable>
            <Pressable 
              style={[styles.deleteButton, isDeleting && { opacity: 0.6 }]} 
              onPress={handleDeleteClient}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#DC3545" />
              ) : (
                <Feather name="trash-2" size={14} color="#DC3545" />
              )}
              <ThemedText style={styles.deleteButtonText}>
                {isDeleting ? "Deleting..." : "Delete"}
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.clientStats}>
            <Pressable style={styles.viewButton} onPress={() => onViewDetails(client)}>
              <ThemedText style={styles.viewButtonText}>View Details</ThemedText>
              <Feather name="arrow-right" size={16} color={AppColors.orangePrimary} />
            </Pressable>
            <Pressable 
              style={[styles.deleteButtonSmall, isDeleting && { opacity: 0.6 }]} 
              onPress={handleDeleteClient}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#DC3545" />
              ) : (
                <Feather name="trash-2" size={16} color="#DC3545" />
              )}
            </Pressable>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function AdminClientsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [resendingClientId, setResendingClientId] = useState<string | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const { data: clients = [], isLoading, refetch, isRefetching } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const filteredClients = clients.filter(client =>
    client.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (client: Client) => {
    navigation.navigate("ClientDetail", { 
      clientId: client.id, 
      clientName: client.businessName 
    });
  };

  const handleResendInvitation = async (client: Client) => {
    setResendingClientId(client.id);
    try {
      await apiRequest("POST", `/api/clients/${client.id}/resend-invitation`);
      Alert.alert(
        "Invitation Sent", 
        `A new invitation has been sent to ${client.email}. The link will expire in 48 hours.`
      );
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send invitation email");
    } finally {
      setResendingClientId(null);
    }
  };

  const handleDeleteClient = async (client: Client) => {
    setDeletingClientId(client.id);
    try {
      await apiRequest("DELETE", `/api/clients/${client.id}`);
      Alert.alert(
        "Client Deleted", 
        `${client.businessName} has been removed successfully.`
      );
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to delete client");
    } finally {
      setDeletingClientId(null);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={AppColors.orangePrimary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={filteredClients}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <ClientCard 
            client={item} 
            index={index} 
            onViewDetails={handleViewDetails}
            onResendInvitation={handleResendInvitation}
            onDeleteClient={handleDeleteClient}
            isResending={resendingClientId === item.id}
            isDeleting={deletingClientId === item.id}
          />
        )}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} 
            onRefresh={refetch} 
            tintColor={AppColors.orangePrimary} 
          />
        }
        ListHeaderComponent={
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, Shadows.card]}>
              <Feather name="search" size={20} color={AppColors.tertiaryText} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search clients..."
                placeholderTextColor={AppColors.tertiaryText}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Feather name="x" size={20} color={AppColors.tertiaryText} />
                </Pressable>
              ) : null}
            </View>
            <Pressable style={styles.addButton} onPress={() => navigation.navigate("AddClient")}>
              <Feather name="plus" size={20} color={AppColors.white} />
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="users" size={48} color={AppColors.tertiaryText} />
            <ThemedText style={styles.emptyText}>No clients found</ThemedText>
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 15,
    color: AppColors.primaryText,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: AppColors.orangePrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  clientCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  clientAvatarText: {
    color: AppColors.orangePrimary,
    fontWeight: "700",
    fontSize: 20,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    color: AppColors.primaryText,
    marginBottom: 2,
  },
  clientEmail: {
    color: AppColors.secondaryText,
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusActive: {
    backgroundColor: "#E8F5E9",
  },
  statusInactive: {
    backgroundColor: "#FFEBEE",
  },
  statusPending: {
    backgroundColor: "#FFF3E0",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E7D32",
  },
  statusTextInactive: {
    color: "#C62828",
  },
  statusTextPending: {
    color: "#E65100",
  },
  clientAvatarPending: {
    backgroundColor: "#FFF3E0",
  },
  clientAvatarTextPending: {
    color: "#E65100",
  },
  invitationActions: {
    borderTopWidth: 1,
    borderTopColor: AppColors.neutral,
    paddingTop: Spacing.md,
  },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  resendButtonText: {
    color: AppColors.orangePrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  deleteButtonText: {
    color: "#DC3545",
    fontWeight: "600",
    fontSize: 14,
  },
  deleteButtonSmall: {
    padding: Spacing.sm,
    marginLeft: Spacing.md,
  },
  clientMeta: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    marginLeft: Spacing.sm,
    color: AppColors.secondaryText,
    fontSize: 13,
  },
  clientStats: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: AppColors.neutral,
    paddingTop: Spacing.md,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  statValue: {
    color: AppColors.primaryText,
    fontWeight: "700",
    fontSize: 18,
  },
  statLabel: {
    color: AppColors.secondaryText,
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: AppColors.neutral,
  },
  viewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: Spacing.xs,
  },
  viewButtonText: {
    color: AppColors.orangePrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    marginTop: Spacing.md,
    color: AppColors.secondaryText,
    fontSize: 16,
  },
});
