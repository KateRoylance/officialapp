import { Platform } from "react-native";

export const AppColors = {
  orangePrimary: "#FF6B35",
  orangeLight: "#FF8C61",
  orangeDark: "#E85A2A",
  background: "#FAFAF8",
  surface: "#FFFFFF",
  softCream: "#FFF5ED",
  primaryText: "#1A1A1A",
  secondaryText: "#666666",
  tertiaryText: "#999999",
  success: "#4CAF50",
  warning: "#FFC107",
  error: "#DC3545",
  neutral: "#E0E0E0",
  white: "#FFFFFF",
};

export const Colors = {
  light: {
    text: AppColors.primaryText,
    textSecondary: AppColors.secondaryText,
    textTertiary: AppColors.tertiaryText,
    buttonText: AppColors.white,
    tabIconDefault: AppColors.secondaryText,
    tabIconSelected: AppColors.orangePrimary,
    link: AppColors.orangePrimary,
    backgroundRoot: AppColors.background,
    backgroundDefault: AppColors.surface,
    backgroundSecondary: AppColors.softCream,
    backgroundTertiary: AppColors.neutral,
    orange: AppColors.orangePrimary,
    orangeLight: AppColors.orangeLight,
    orangeDark: AppColors.orangeDark,
    success: AppColors.success,
    cardShadow: "rgba(0, 0, 0, 0.08)",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    textTertiary: "#687076",
    buttonText: AppColors.white,
    tabIconDefault: "#9BA1A6",
    tabIconSelected: AppColors.orangeLight,
    link: AppColors.orangeLight,
    backgroundRoot: "#1A1A1A",
    backgroundDefault: "#2A2A2A",
    backgroundSecondary: "#3A3A3A",
    backgroundTertiary: "#4A4A4A",
    orange: AppColors.orangeLight,
    orangeLight: AppColors.orangeLight,
    orangeDark: AppColors.orangeDark,
    success: AppColors.success,
    cardShadow: "rgba(0, 0, 0, 0.3)",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
};

export const Shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  fab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
