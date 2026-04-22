import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AdminTabNavigator from "@/navigation/AdminTabNavigator";
import PendingApprovalsScreen from "@/screens/admin/PendingApprovalsScreen";
import ScheduledPostsScreen from "@/screens/admin/ScheduledPostsScreen";
import UnreadMessagesScreen from "@/screens/admin/UnreadMessagesScreen";
import ClientMessagesScreen from "@/screens/admin/ClientMessagesScreen";
import AddClientScreen from "@/screens/admin/AddClientScreen";
import ClientDetailScreen from "@/screens/admin/ClientDetailScreen";
import NotificationSettingsScreen from "@/screens/admin/NotificationSettingsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { AdminStackParamList } from "@/navigation/types";

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="AdminTabs"
        component={AdminTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PendingApprovals"
        component={PendingApprovalsScreen}
        options={{ headerTitle: "Pending Approvals" }}
      />
      <Stack.Screen
        name="ScheduledPosts"
        component={ScheduledPostsScreen}
        options={{ headerTitle: "Today's Scheduled Posts" }}
      />
      <Stack.Screen
        name="UnreadMessages"
        component={UnreadMessagesScreen}
        options={{ headerTitle: "Unread Messages" }}
      />
      <Stack.Screen
        name="ClientMessages"
        component={ClientMessagesScreen}
        options={({ route }) => ({ headerTitle: route.params.clientName })}
      />
      <Stack.Screen
        name="AddClient"
        component={AddClientScreen}
        options={{ headerTitle: "Enroll Client" }}
      />
      <Stack.Screen
        name="ClientDetail"
        component={ClientDetailScreen}
        options={({ route }) => ({ headerTitle: route.params.clientName })}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ headerTitle: "Notifications" }}
      />
    </Stack.Navigator>
  );
}
