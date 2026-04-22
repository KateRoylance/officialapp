import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  Platform,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { login, loginWithBiometrics, hasBiometrics, biometricType, rememberMe, setRememberMe } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const buttonScale = useSharedValue(1);
  const biometricScale = useSharedValue(1);
  const shakeAnimation = useSharedValue(0);

  useEffect(() => {
    if (hasBiometrics && rememberMe) {
      handleBiometricLogin();
    }
  }, []);

  const handleBiometricLogin = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const success = await loginWithBiometrics();
    if (success && Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password");
      shakeAnimation.value = withSequence(
        withSpring(-10, { damping: 3, stiffness: 400 }),
        withSpring(10, { damping: 3, stiffness: 400 }),
        withSpring(-10, { damping: 3, stiffness: 400 }),
        withSpring(0, { damping: 3, stiffness: 400 })
      );
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setIsLoading(true);
    setError("");

    const success = await login(email, password, rememberMe);
    
    if (success) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      setError("Login failed. Please try again.");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
    
    setIsLoading(false);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const biometricAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: biometricScale.value }],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }],
  }));

  return (
    <LinearGradient
      colors={[AppColors.softCream, AppColors.background, "#FFF0E8"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={[styles.content, { paddingTop: insets.top + Spacing["4xl"], paddingBottom: insets.bottom + Spacing.xl }]}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="h2" style={styles.appName}>Blossom & Bloom</ThemedText>
          <ThemedText type="small" style={styles.tagline}>Marketing Made Simple</ThemedText>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(200).duration(500)} 
          style={[styles.formCard, formAnimatedStyle, Shadows.card]}
        >
          <ThemedText type="h4" style={styles.welcomeText}>Welcome Back</ThemedText>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={16} color="#E53935" />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Feather name="mail" size={20} color={AppColors.secondaryText} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email address"
              placeholderTextColor={AppColors.tertiaryText}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              testID="input-email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="lock" size={20} color={AppColors.secondaryText} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={AppColors.tertiaryText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              testID="input-password"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={20} color={AppColors.secondaryText} />
            </Pressable>
          </View>

          <View style={styles.rememberRow}>
            <View style={styles.rememberContainer}>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                trackColor={{ false: AppColors.neutral, true: AppColors.orangeLight }}
                thumbColor={rememberMe ? AppColors.orangePrimary : AppColors.white}
                ios_backgroundColor={AppColors.neutral}
                testID="switch-remember"
              />
              <ThemedText style={styles.rememberText}>Remember me</ThemedText>
            </View>
            <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
              <ThemedText style={styles.forgotText}>Forgot password?</ThemedText>
            </Pressable>
          </View>

          <AnimatedPressable
            onPress={handleLogin}
            onPressIn={() => { buttonScale.value = withSpring(0.97); }}
            onPressOut={() => { buttonScale.value = withSpring(1); }}
            disabled={isLoading}
            style={[styles.loginButton, buttonAnimatedStyle]}
            testID="button-signin"
          >
            <LinearGradient
              colors={[AppColors.orangePrimary, AppColors.orangeLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color={AppColors.white} />
              ) : (
                <ThemedText style={styles.loginButtonText}>Sign In</ThemedText>
              )}
            </LinearGradient>
          </AnimatedPressable>

          {hasBiometrics ? (
            <Animated.View entering={FadeInDown.delay(400).duration(400)}>
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <ThemedText style={styles.dividerText}>or</ThemedText>
                <View style={styles.divider} />
              </View>

              <AnimatedPressable
                onPress={handleBiometricLogin}
                onPressIn={() => { biometricScale.value = withSpring(0.97); }}
                onPressOut={() => { biometricScale.value = withSpring(1); }}
                style={[styles.biometricButton, biometricAnimatedStyle]}
                testID="button-biometric"
              >
                <Feather 
                  name={biometricType === "Face ID" ? "smile" : "smartphone"} 
                  size={24} 
                  color={AppColors.orangePrimary} 
                />
                <ThemedText style={styles.biometricText}>
                  Sign in with {biometricType}
                </ThemedText>
              </AnimatedPressable>
            </Animated.View>
          ) : null}
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing["2xl"],
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.lg,
  },
  appName: {
    color: AppColors.primaryText,
    marginBottom: Spacing.xs,
  },
  tagline: {
    color: AppColors.secondaryText,
  },
  formCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing["2xl"],
  },
  welcomeText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    color: AppColors.primaryText,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: "#E53935",
    marginLeft: Spacing.sm,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    height: Spacing.inputHeight,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  eyeButton: {
    padding: Spacing.sm,
    marginRight: -Spacing.sm,
  },
  rememberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberText: {
    marginLeft: Spacing.sm,
    color: AppColors.secondaryText,
    fontSize: 14,
  },
  forgotText: {
    color: AppColors.orangePrimary,
    fontSize: 14,
  },
  loginButton: {
    overflow: "hidden",
    borderRadius: BorderRadius.sm,
  },
  loginButtonGradient: {
    height: Spacing.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
  },
  loginButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: AppColors.neutral,
  },
  dividerText: {
    marginHorizontal: Spacing.lg,
    color: AppColors.tertiaryText,
    fontSize: 14,
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: AppColors.orangePrimary,
    backgroundColor: AppColors.white,
  },
  biometricText: {
    marginLeft: Spacing.md,
    color: AppColors.orangePrimary,
    fontSize: 16,
    fontWeight: "500",
  },
});
