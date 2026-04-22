import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, AppColors, Shadows } from "@/constants/theme";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
  index: number;
}

function MenuItem({ icon, label, onPress, isDestructive = false, index }: MenuItemProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[styles.menuItem, Shadows.card, cardStyle]}
      >
        <View style={[styles.menuIconContainer, isDestructive && styles.destructiveIcon]}>
          <Feather 
            name={icon as any} 
            size={20} 
            color={isDestructive ? "#E53935" : AppColors.orangePrimary} 
          />
        </View>
        <ThemedText style={[styles.menuLabel, isDestructive && styles.destructiveLabel]}>
          {label}
        </ThemedText>
        <Feather name="chevron-right" size={20} color={AppColors.tertiaryText} />
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  const handleLogout = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    await logout();
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <Animated.View 
        entering={FadeInDown.duration(400)} 
        style={[styles.profileCard, Shadows.card]}
      >
        <View style={styles.avatarLarge}>
          <ThemedText style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </ThemedText>
        </View>
        <ThemedText type="h4" style={styles.userName}>{user?.name || "User"}</ThemedText>
        <ThemedText style={styles.userEmail}>{user?.email || "user@example.com"}</ThemedText>
      </Animated.View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Account</ThemedText>
        <MenuItem icon="user" label="Edit Profile" onPress={() => navigation.navigate("EditProfile")} index={0} />
        <MenuItem icon="bell" label="Notifications" onPress={() => navigation.navigate("NotificationSettings")} index={1} />
        <MenuItem icon="lock" label="Privacy & Security" onPress={() => navigation.navigate("PrivacySecurity")} index={2} />
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Support</ThemedText>
        <MenuItem icon="help-circle" label="Help Center" onPress={() => navigation.navigate("HelpCenter")} index={3} />
        <MenuItem icon="message-circle" label="Contact Us" onPress={() => navigation.navigate("ContactUs")} index={4} />
      </View>

      <View style={styles.section}>
        <MenuItem 
          icon="log-out" 
          label="Sign Out" 
          onPress={handleLogout} 
          isDestructive 
          index={5}
        />
      </View>

      <ThemedText style={styles.versionText}>Blossom & Bloom v1.0.0</ThemedText>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing["2xl"],
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.orangePrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  avatarText: {
    color: AppColors.white,
    fontSize: 32,
    fontWeight: "600",
  },
  userName: {
    color: AppColors.primaryText,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    color: AppColors.secondaryText,
    fontSize: 14,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.tertiaryText,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  destructiveIcon: {
    backgroundColor: "#FFEBEE",
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: AppColors.primaryText,
  },
  destructiveLabel: {
    color: "#E53935",
  },
  versionText: {
    textAlign: "center",
    color: AppColors.tertiaryText,
    fontSize: 12,
    marginTop: Spacing.lg,
  },
});
