import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

import AdminDashboardScreen from "@/screens/admin/AdminDashboardScreen";
import AdminClientsScreen from "@/screens/admin/AdminClientsScreen";
import AdminIdeasScreen from "@/screens/admin/AdminIdeasScreen";
import AdminUploadsScreen from "@/screens/admin/AdminUploadsScreen";
import AdminContentScreen from "@/screens/admin/AdminContentScreen";
import AdminSettingsScreen from "@/screens/admin/AdminSettingsScreen";
import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { AppColors } from "@/constants/theme";
import { AdminTabParamList } from "@/navigation/types";

const Tab = createBottomTabNavigator<AdminTabParamList>();

export default function AdminTabNavigator() {
  const { theme, isDark } = useTheme();
  const screenOptions = useScreenOptions();

  return (
    <Tab.Navigator
      initialRouteName="DashboardTab"
      screenOptions={{
        tabBarActiveTintColor: AppColors.orangePrimary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 10,
        },
        ...screenOptions,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={AdminDashboardScreen}
        options={{
          title: "Dashboard",
          headerTitle: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ClientsTab"
        component={AdminClientsScreen}
        options={{
          title: "Clients",
          headerTitle: "Clients",
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="IdeasTab"
        component={AdminIdeasScreen}
        options={{
          title: "Ideas",
          headerTitle: "Content Ideas",
          tabBarIcon: ({ color, size }) => (
            <Feather name="zap" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="UploadsTab"
        component={AdminUploadsScreen}
        options={{
          title: "Uploads",
          headerTitle: "New Uploads",
          tabBarIcon: ({ color, size }) => (
            <Feather name="upload-cloud" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ContentTab"
        component={AdminContentScreen}
        options={{
          title: "Content",
          headerTitle: "Content",
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={AdminSettingsScreen}
        options={{
          title: "Settings",
          headerTitle: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
