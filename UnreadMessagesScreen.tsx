import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { AppColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { AdminStackParamList } from "@/navigation/types";

interface ClientMessages {
  id: string;
  clientName: string;
  newMessages: number;
  newComments: number;
  lastActivity: string;
}

const INITIAL_CLIENTS: ClientMessages[] = [
  { id: "1", clientName: "Sarah's Bakery", newMessages: 3, newComments: 2, lastActivity: "10 min ago" },
  { id: "2", clientName: "Mike's Fitness", newMessages: 5, newComments: 0, lastActivity: "25 min ago" },
  { id: "3", clientName: "Green Garden Co", newMessages: 0, newComments: 4, lastActivity: "1 hour ago" },
  { id: "4", clientName: "Tech Solutions", newMessages: 2, newComments: 1, lastActivity: "2 hours ago" },
  { id: "5", clientName: "Bella Boutique", newMessages: 0, newComments: 0, lastActivity: "3 hours ago" },
  { id: "6", clientName: "Urban Cafe", newMessages: 1, newComments: 3, lastActivity: "4 hours ago" },
  { id: "7", clientName: "Pet Paradise", newMessages: 0, newComments: 0, lastActivity: "1 day ago" },
  { id: "8", clientName: "Fresh Flowers Co", newMessages: 0, newComments: 2, lastActivity: "1 day ago" },
  { id: "9", clientName: "Sunrise Yoga", newMessages: 0, newComments: 0, lastActivity: "2 days ago" },
  { id: "10", clientName: "Home Decor Plus", newMessages: 0, newComments: 0, lastActivity: "3 days ago" },
  { id: "11", clientName: "City Plumbing", newMessages: 0, newComments: 0, lastActivity: "5 days ago" },
  { id: "12", clientName: "Art Gallery One", newMessages: 0, newComments: 0, lastActivity: "1 week ago" },
];

function ClientCard({ client, index, onPress }: { client: ClientMessages; index: number; onPress: () => void }) {
  const hasNewActivity = client.newMessages > 0 || client.newComments > 0;
  const totalNew = client.newMessages + client.newComments;

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(400)}>
      <Pressable 
        style={[styles.clientCard, Shadows.card, hasNewActivity && styles.clientCardActive]}
        onPress={onPress}
      >
        <View style={[styles.clientAvatar, hasNewActivity && styles.clientAvatarActive]}>
          <ThemedText style={[styles.clientAvatarText, hasNewActivity && styles.clientAvatarTextActive]}>
            {client.clientName.charAt(0)}
          </ThemedText>
        </View>

        <View style={styles.clientInfo}>
          <View style={styles.clientNameRow}>
            <ThemedText type="h4" style={styles.clientName}>{client.clientName}</ThemedText>
            {hasNewActivity ? (
              <View style={styles.newBadge}>
                <ThemedText style={styles.newBadgeText}>{totalNew} new</ThemedText>
              </View>
            ) : null}
          </View>
          
          <View style={styles.statsRow}>
            {client.newMessages > 0 ? (
              <View style={styles.statItem}>
                <Feather name="message-circle" size={12} color="#2196F3" />
                <ThemedText style={styles.statText}>{client.newMessages} DMs</ThemedText>
              </View>
            ) : null}
            {client.newComments > 0 ? (
              <View style={styles.statItem}>
                <Feather name="message-square" size={12} color="#9C27B0" />
                <ThemedText style={styles.statText}>{client.newComments} comments</ThemedText>
              </View>
            ) : null}
            {!hasNewActivity ? (
              <ThemedText style={styles.noActivityText}>No new activity</ThemedText>
            ) : null}
          </View>

          <ThemedText style={styles.lastActivity}>Last activity: {client.lastActivity}</ThemedText>
        </View>

        <Feather name="chevron-right" size={20} color={AppColors.tertiaryText} />
      </Pressable>
    </Animated.View>
  );
}

export default function UnreadMessagesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const [clients, setClients] = useState(INITIAL_CLIENTS);

  const handleClientPress = (client: ClientMessages) => {
    setClients(prev => prev.map(c => 
      c.id === client.id ? { ...c, newMessages: 0, newComments: 0 } : c
    ));
    navigation.navigate("ClientMessages", { clientId: client.id, clientName: client.clientName });
  };

  const totalNewMessages = clients.reduce((sum, c) => sum + c.newMessages, 0);
  const totalNewComments = clients.reduce((sum, c) => sum + c.newComments, 0);
  const clientsWithActivity = clients.filter(c => c.newMessages > 0 || c.newComments > 0).length;

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
        <View style={[styles.summaryCard, Shadows.card]}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: "#E3F2FD" }]}>
              <Feather name="message-circle" size={20} color="#2196F3" />
            </View>
            <ThemedText style={styles.summaryValue}>{totalNewMessages}</ThemedText>
            <ThemedText style={styles.summaryLabel}>New DMs</ThemedText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: "#F3E5F5" }]}>
              <Feather name="message-square" size={20} color="#9C27B0" />
            </View>
            <ThemedText style={styles.summaryValue}>{totalNewComments}</ThemedText>
            <ThemedText style={styles.summaryLabel}>New Comments</ThemedText>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>All Clients</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>{clientsWithActivity} with new activity</ThemedText>
        </View>

        {clients.map((client, index) => (
          <ClientCard 
            key={client.id} 
            client={client} 
            index={index} 
            onPress={() => handleClientPress(client)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    marginBottom: Spacing.xl,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  summaryValue: {
    color: AppColors.primaryText,
    fontSize: 20,
    fontWeight: "700",
  },
  summaryLabel: {
    color: AppColors.secondaryText,
    fontSize: 12,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: AppColors.neutral,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: AppColors.secondaryText,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    color: AppColors.orangePrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  clientCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  clientCardActive: {
    borderLeftWidth: 3,
    borderLeftColor: AppColors.orangePrimary,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.neutral,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  clientAvatarActive: {
    backgroundColor: AppColors.softCream,
  },
  clientAvatarText: {
    color: AppColors.secondaryText,
    fontWeight: "700",
    fontSize: 18,
  },
  clientAvatarTextActive: {
    color: AppColors.orangePrimary,
  },
  clientInfo: {
    flex: 1,
  },
  clientNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 4,
  },
  clientName: {
    color: AppColors.primaryText,
  },
  newBadge: {
    backgroundColor: AppColors.orangePrimary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  newBadgeText: {
    color: AppColors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: 4,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: AppColors.secondaryText,
    fontSize: 12,
  },
  noActivityText: {
    color: AppColors.tertiaryText,
    fontSize: 12,
  },
  lastActivity: {
    color: AppColors.tertiaryText,
    fontSize: 11,
  },
});
