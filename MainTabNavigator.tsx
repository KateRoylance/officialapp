import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

import IdeasStackNavigator from "@/navigation/IdeasStackNavigator";
import UploadStackNavigator from "@/navigation/UploadStackNavigator";
import CalendarStackNavigator from "@/navigation/CalendarStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { AppColors } from "@/constants/theme";

export type MainTabParamList = {
  IdeasTab: undefined;
  UploadTab: undefined;
  CalendarTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const { isSupport } = useAuth();

  return (
    <Tab.Navigator
      initialRouteName="IdeasTab"
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
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 10,
        },
      }}
    >
      <Tab.Screen
        name="IdeasTab"
        component={IdeasStackNavigator}
        options={{
          title: "Ideas",
          tabBarIcon: ({ color, size }) => (
            <Feather name="zap" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="UploadTab"
        component={UploadStackNavigator}
        options={{
          title: "Upload",
          tabBarIcon: ({ color, size }) => (
            <Feather name="upload-cloud" size={size} color={color} />
          ),
        }}
      />
      {!isSupport ? (
        <Tab.Screen
          name="CalendarTab"
          component={CalendarStackNavigator}
          options={{
            title: "Calendar",
            tabBarIcon: ({ color, size }) => (
              <Feather name="calendar" size={size} color={color} />
            ),
          }}
        />
      ) : null}
      {!isSupport ? (
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStackNavigator}
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Feather name="user" size={size} color={color} />
            ),
          }}
        />
      ) : null}
    </Tab.Navigator>
  );
}
