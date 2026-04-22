import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, AppColors, Shadows } from "@/constants/theme";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleChangePhoto = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      if (Platform.OS === "web") {
        window.alert("Permission to access photos is required to change your profile picture.");
      } else {
        Alert.alert("Permission Required", "Permission to access photos is required to change your profile picture.");
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
      if (Platform.OS === "web") {
        window.alert("Profile photo updated!");
      } else {
        Alert.alert("Success", "Profile photo updated!");
      }
    }
  };

  const handleContactKate = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL("mailto:kate@blossomandbloommarketing.com?subject=Profile Change Request");
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <Animated.View 
        entering={FadeInDown.duration(400)} 
        style={[styles.avatarSection, Shadows.card]}
      >
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarLarge}>
            <ThemedText style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </ThemedText>
          </View>
        )}
        <Pressable style={styles.changePhotoButton} onPress={handleChangePhoto}>
          <Feather name="camera" size={16} color={AppColors.orangePrimary} />
          <ThemedText style={styles.changePhotoText}>Change Photo</ThemedText>
        </Pressable>
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(100).duration(400)}
        style={[styles.formSection, Shadows.card]}
      >
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Business Name</ThemedText>
          <View style={styles.readOnlyField}>
            <ThemedText style={styles.readOnlyText}>{user?.name || "Not set"}</ThemedText>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Email Address</ThemedText>
          <View style={styles.readOnlyField}>
            <ThemedText style={styles.readOnlyText}>{user?.email || "Not set"}</ThemedText>
          </View>
        </View>

        <View style={[styles.inputGroup, { marginBottom: 0 }]}>
          <ThemedText style={styles.label}>Phone Number</ThemedText>
          <View style={styles.readOnlyField}>
            <ThemedText style={styles.readOnlyText}>Not set</ThemedText>
          </View>
        </View>
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(200).duration(400)}
        style={[styles.infoCard, Shadows.card]}
      >
        <View style={styles.infoIconContainer}>
          <Feather name="info" size={20} color={AppColors.orangePrimary} />
        </View>
        <View style={styles.infoContent}>
          <ThemedText style={styles.infoTitle}>Need to update your details?</ThemedText>
          <ThemedText style={styles.infoText}>
            Please contact Kate to make any changes to your profile information.
          </ThemedText>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <Pressable style={styles.contactButton} onPress={handleContactKate}>
          <Feather name="mail" size={20} color={AppColors.white} />
          <ThemedText style={styles.contactButtonText}>Contact Kate</ThemedText>
        </Pressable>
      </Animated.View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatarSection: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing["2xl"],
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.orangePrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: AppColors.white,
    fontSize: 40,
    fontWeight: "600",
  },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  changePhotoText: {
    color: AppColors.orangePrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  formSection: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primaryText,
    marginBottom: Spacing.sm,
  },
  readOnlyField: {
    backgroundColor: AppColors.softCream,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  readOnlyText: {
    fontSize: 16,
    color: AppColors.secondaryText,
  },
  infoCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.softCream,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.primaryText,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: AppColors.secondaryText,
    lineHeight: 20,
  },
  contactButton: {
    backgroundColor: AppColors.orangePrimary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  contactButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
