import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import AdminStackNavigator from "@/navigation/AdminStackNavigator";
import LoginScreen from "@/screens/LoginScreen";
import SetPasswordScreen from "@/screens/SetPasswordScreen";
import ForgotPasswordScreen from "@/screens/ForgotPasswordScreen";
import ResetPasswordScreen from "@/screens/ResetPasswordScreen";
import PrivacyConsentScreen from "@/screens/PrivacyConsentScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";
import { AppColors } from "@/constants/theme";

export type RootStackParamList = {
  Login: undefined;
  SetPassword: { token: string; email: string; businessName: string };
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  PrivacyConsent: undefined;
  Main: undefined;
  Admin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated, isLoading, isAdmin, needsPrivacyConsent } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.orangePrimary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {isAuthenticated ? (
        isAdmin ? (
          <Stack.Screen
            name="Admin"
            component={AdminStackNavigator}
            options={{ headerShown: false }}
          />
        ) : needsPrivacyConsent ? (
          <Stack.Screen
            name="PrivacyConsent"
            component={PrivacyConsentScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
        )
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SetPassword"
            component={SetPasswordScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ResetPassword"
            component={ResetPasswordScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.background,
  },
});
