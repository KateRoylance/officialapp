import React from "react";
import { View, StyleSheet, Image } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, AppColors } from "@/constants/theme";

interface HeaderTitleProps {
  title: string;
  showLogo?: boolean;
}

export function HeaderTitle({ title, showLogo = true }: HeaderTitleProps) {
  return (
    <View style={styles.container}>
      {showLogo ? (
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      ) : null}
      <ThemedText style={styles.title}>{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  icon: {
    width: 28,
    height: 28,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: AppColors.primaryText,
  },
});
