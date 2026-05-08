import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dimensions, PixelRatio, Platform } from "react-native";

export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

export async function readStoredTheme(): Promise<ThemeMode | null> {
  try {
    const v = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
    return null;
  } catch {
    return null;
  }
}

export async function writeStoredTheme(mode: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
}

export type ThemedColors = {
  canvas: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  border: string;
  borderMuted: string;
  brand: string;
  onBrand: string;
  primary: string;
  onPrimary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  slate: string;
  slateSecondary: string;
  tabBarActive: string;
  tabBarInactive: string;
  tabBarBg: string;
  hubFabBg: string;
  hubFabFg: string;
  hubTabActive: string;
  hubTabInactive: string;
  hubTabBorder: string;
  refreshTint: string;
  heroBackground: string;
  heroText: string;
  progressTrack: string;
  progressFill: string;
  walletGlass: string;
  achievementSurface: string;
  achievementBorder: string;
  refCardSurface: string;
  refCardBorder: string;
  referralBoxBg: string;
  referralBoxBorder: string;
  modalBackground: string;
  modalInputBg: string;
  modalInputBorder: string;
  placeholder: string;
  modalIconBg: string;
  cancelButtonBg: string;
  cancelButtonBorder: string;
  cancelButtonText: string;
  ctaPrimaryBg: string;
  ctaPrimaryFg: string;
  destructive: string;
  overlay: string;
};

export function getThemedColors(mode: ThemeMode): ThemedColors {
  const C = Design.colors;
  const dark = mode === "dark";
  return {
    canvas: dark ? C.dark.canvas : C.background.canvas,
    surface: dark ? C.dark.surface : C.background.white,
    surfaceElevated: dark ? C.dark.surfaceElevated : C.background.white,
    surfaceMuted: dark ? C.dark.canvas : C.background.surfaceMuted,
    border: dark ? C.dark.border : C.border.default,
    borderMuted: dark ? C.dark.border : C.border.hub,
    brand: C.mint.DEFAULT,
    onBrand: C.mint.onMint,
    primary: C.primary.accentDarkest,
    onPrimary: C.mint.DEFAULT,
    textPrimary: dark ? C.text.darkPrimary : C.text.primary,
    textSecondary: dark ? C.text.darkSecondary : C.text.secondary,
    textTertiary: dark ? C.text.darkTertiary : C.text.tertiary,
    slate: dark ? C.text.darkPrimary : C.text.slate,
    slateSecondary: dark ? C.text.darkSecondary : C.text.slateSecondary,
    tabBarActive: dark ? C.background.white : C.mint.DEFAULT,
    tabBarInactive: dark ? C.gray.tabInactiveDark : C.text.black,
    tabBarBg: dark ? C.dark.canvas : C.background.canvas,
    hubFabBg: dark ? C.mint.DEFAULT : C.primary.accentDarkest,
    hubFabFg: dark ? C.text.primary : C.mint.DEFAULT,
    hubTabActive: dark ? C.text.darkPrimary : C.primary.accentDarkest,
    hubTabInactive: dark ? C.text.darkSecondary : C.text.slateSecondary,
    hubTabBorder: dark ? C.text.darkPrimary : C.primary.accentDarkest,
    refreshTint: dark ? C.mint.DEFAULT : C.primary.accentDarkest,
    heroBackground: dark ? C.mint.DEFAULT : C.text.black,
    heroText: dark ? C.mint.onMint : C.mint.DEFAULT,
    progressTrack: dark ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.10)",
    progressFill: dark ? C.mint.onMint : C.mint.DEFAULT,
    walletGlass: dark
      ? "rgba(255, 255, 255, 0.60)"
      : "rgba(255, 255, 255, 0.10)",
    achievementSurface: dark ? C.dark.surface : C.background.white,
    achievementBorder: dark ? C.dark.border : C.border.hub,
    refCardSurface: dark ? C.dark.surface : C.background.white,
    refCardBorder: dark ? C.dark.border : C.border.hub,
    referralBoxBg: dark ? C.dark.border : C.background.canvas,
    referralBoxBorder: dark ? C.dark.border : C.border.hub,
    modalBackground: dark ? C.dark.surface : C.background.white,
    modalInputBg: dark ? C.dark.border : C.background.canvas,
    modalInputBorder: dark ? C.dark.border : C.border.hub,
    placeholder: dark ? C.text.darkSecondary : C.text.slateSecondary,
    modalIconBg: "rgba(0, 255, 128, 0.1)",
    cancelButtonBg: dark ? C.text.black : C.background.white,
    cancelButtonBorder: dark ? C.mint.DEFAULT : C.text.black,
    cancelButtonText: dark ? C.mint.DEFAULT : C.text.black,
    ctaPrimaryBg: dark ? C.mint.DEFAULT : C.primary.accentDarkest,
    ctaPrimaryFg: dark ? C.mint.onMint : C.mint.DEFAULT,
    destructive: C.semantic.errorIos,
    overlay: C.overlay.backdrop,
  };
}

export function getStatusBarStyle(mode: ThemeMode): "light" | "dark" {
  return mode === "dark" ? "light" : "dark";
}

export function getBlurTint(mode: ThemeMode): "light" | "dark" {
  return mode === "dark" ? "dark" : "light";
}

export function tabIconHome(mode: ThemeMode) {
  return mode === "dark"
    ? require("@/assets/images/icons/dark/home.png")
    : require("@/assets/images/icons/home.png");
}

export function tabIconGift(mode: ThemeMode) {
  return mode === "dark"
    ? require("@/assets/images/icons/dark/gift.png")
    : require("@/assets/images/icons/gift.png");
}

export function tabIconUser(mode: ThemeMode) {
  return mode === "dark"
    ? require("@/assets/images/icons/dark/user.png")
    : require("@/assets/images/icons/user.png");
}

export function iconSettings(mode: ThemeMode) {
  return mode === "dark"
    ? require("@/assets/images/icons/dark/settings.png")
    : require("@/assets/images/icons/settings.png");
}

export function iconLevel(mode: ThemeMode) {
  return mode === "dark"
    ? require("@/assets/images/icons/dark/level.png")
    : require("@/assets/images/icons/level.png");
}

export function iconMedalXp(mode: ThemeMode) {
  return mode === "dark"
    ? require("@/assets/images/icons/dark/medal-05.png")
    : require("@/assets/images/icons/medal.png");
}

export function iconWallet(mode: ThemeMode) {
  return mode === "dark"
    ? require("@/assets/images/icons/dark/wallet.png")
    : require("@/assets/images/icons/wallet.png");
}

export function iconCopy(mode: ThemeMode) {
  return mode === "dark"
    ? require("@/assets/images/icons/dark/copy.png")
    : require("@/assets/images/icons/copy.png");
}

export function iconClock(mode: ThemeMode) {
  return mode === "dark"
    ? require("@/assets/images/icons/dark/clock.png")
    : require("@/assets/images/icons/clock.png");
}

export function iconNotebook(mode: ThemeMode) {
  return mode === "dark"
    ? require("@/assets/images/icons/dark/notebook.png")
    : require("@/assets/images/icons/notebook.png");
}

export function iconCaretRight(mode: ThemeMode) {
  return mode === "dark"
    ? require("@/assets/images/icons/dark/CaretRight.png")
    : require("@/assets/images/icons/CaretRight.png");
}

export function iconCalendar(mode: ThemeMode) {
  return mode === "dark"
    ? require("@/assets/images/icons/dark/calendar.png")
    : require("@/assets/images/icons/calendar.png");
}

export function iconSealCheck(mode: ThemeMode) {
  return mode === "dark"
    ? require("@/assets/images/icons/dark/SealCheck.png")
    : require("@/assets/images/icons/SealCheck.png");
}

export function iconNotification(mode: ThemeMode) {
  return mode === "dark"
    ? require("@/assets/images/icons/dark/notification.png")
    : require("@/assets/images/icons/notification.png");
}

export function iconSearch(mode: ThemeMode) {
  return mode === "dark"
    ? require("@/assets/images/icons/dark/search.png")
    : require("@/assets/images/icons/search-normal.png");
}

type ComponentStyle = {
  [key: string]: {
    [key: string]: string | number | boolean;
  };
};

const { width, height } = Dimensions.get("window");
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export const scale = (size: number) =>
  Math.round(PixelRatio.roundToNearestPixel(size * (width / BASE_WIDTH)));

export const verticalScale = (size: number) =>
  Math.round(PixelRatio.roundToNearestPixel(size * (height / BASE_HEIGHT)));

export const getScreenTopPadding = (insets: { top: number }) =>
  insets.top + Design.spacing.sm;

export const getTheme = (mode: ThemeMode) => {
  return mode === "dark" ? Design.colors.dark : Design.colors.background;
};

export const getComponentStyles = (
  component: string,
  mode: ThemeMode,
): ComponentStyle => {
  const theme = getTheme(mode);
  const styles: { [key: string]: ComponentStyle } = {
    button: {
      primary: {
        backgroundColor: Design.colors.primary.accentDark,
        color: Design.colors.text.primary,
        paddingVertical: Design.spacing.md,
        paddingHorizontal: Design.spacing.lg,
        borderRadius: 8,
      },
      secondary: {
        backgroundColor: Design.colors.background.surface,
        color: Design.colors.text.primary,
        paddingVertical: Design.spacing.md,
        paddingHorizontal: Design.spacing.lg,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Design.colors.border.default,
      },
    },
    input: {
      default: {
        backgroundColor: Design.colors.background.input,
        borderWidth: 1,
        borderColor: Design.colors.border.input,
        borderRadius: 8,
        paddingVertical: Design.spacing.sm,
        paddingHorizontal: Design.spacing.md,
        color: Design.colors.text.primary,
      },
    },
    card: {
      default: {
        backgroundColor: Design.colors.background.white,
        borderRadius: 12,
        padding: Design.spacing.md,
        shadowColor: Design.colors.shadow.default,
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
    },
    text: {
      heading: Design.typography.styles.screenTitle,
      body: Design.typography.styles.body,
      caption: Design.typography.styles.caption,
    },
  };
  return styles[component] || {};
};

export const Design = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    mdLg: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontFamily: {
      satoshi: {
        regular: "Satoshi-Regular" as const,
        medium: "Satoshi-Medium" as const,
        bold: "Satoshi-Bold" as const,
      },
      urbanist: {
        regular: "Urbanist" as const,
      },
      monospace: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    fontSize: {
      "2xs": 10,
      xs: 12,
      sm: 14,
      base: 16,
      md: 18,
      lg: 20,
      xl: 24,
      "2xl": 28,
      "3xl": 32,
    },
    lineHeight: {
      "2xs": 14,
      xs: 16,
      sm: 20,
      base: 22,
      md: 24,
      lg: 26,
      xl: 30,
      "2xl": 34,
      "3xl": 38,
    },
    fontWeight: {
      regular: "400" as const,
      medium: "500" as const,
      semibold: "600" as const,
      bold: "700" as const,
    },
    styles: {
      screenTitle: {
        fontFamily: "Satoshi-Regular",
        fontSize: 20,
        lineHeight: 24,
        fontWeight: "500" as const,
      },
      sectionTitle: {
        fontFamily: "Satoshi-Regular",
        fontSize: 18,
        lineHeight: 22,
        fontWeight: "500" as const,
      },
      body: {
        fontFamily: "Satoshi-Regular",
        fontSize: 16,
        lineHeight: 22,
        fontWeight: "400" as const,
      },
      bodyMedium: {
        fontFamily: "Satoshi-Medium",
        fontSize: 16,
        lineHeight: 22,
        fontWeight: "500" as const,
      },
      bodySmall: {
        fontFamily: "Satoshi-Regular",
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "400" as const,
      },
      caption: {
        fontFamily: "Satoshi-Regular",
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "400" as const,
      },
      captionMedium: {
        fontFamily: "Satoshi-Medium",
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "500" as const,
      },
      tabLabel: {
        fontFamily: "Satoshi-Regular",
        fontSize: 10,
        lineHeight: 14,
        fontWeight: "400" as const,
      },
      displayUrbanist: {
        fontFamily: "Urbanist",
        fontSize: 16,
        lineHeight: 22,
        fontWeight: "400" as const,
      },
    },
  },
  colors: {
    primary: {
      accent: "#D28D1D",
      accentDark: "#D08C1D",
      accentAlt: "#BB8F54",
      accentDarkest: "#7C4400",
      accentTint: "rgba(208, 140, 29, 0.3)",
      accentTintLight: "rgba(208, 140, 29, 0.1)",
    },
    mint: {
      DEFAULT: "#00FF80",
      darkUi: "#00FF66",
      onMint: "#000000",
      streakIcon: "#006131",
      bubbleTint: "#C8F4DD",
    },
    text: {
      primary: "#111827",
      primaryShort: "#111",
      black: "#000000",
      secondary: "#6B7280",
      tertiary: "#828282",
      muted: "#9CA3AF",
      placeholder: "#727272",
      disabled: "#B9B9B9",
      muted2: "#989898",
      s: "#3F3F3F",
      slate: "#2D3C52",
      slateSecondary: "#61728C",
      slateTertiary: "#4A5568",
      slatePlaceholder: "#A0AEC0",
      darkPrimary: "#E0E0E0",
      darkSecondary: "#B3B3B3",
      darkTertiary: "#E8E8E8",
    },
    background: {
      white: "#FFFFFF",
      surface: "#F9FAFB",
      surfaceAlt: "#F5F5F5",
      surfaceMuted: "#F2F2F2",
      input: "#F3F4F6",
      border: "#E5E7EB",
      borderAlt: "#EFEFEF",
      surfaceAlt2: "#FBF4E8",
      canvas: "#F9FBFC",
      surfaceSubtle: "#F7FAFC",
      messageTint: "#F0F4FF",
    },
    border: {
      default: "#E5E7EB",
      light: "#E0E0E0",
      muted: "#F3F4F6",
      muted2: "#D5D7DA",
      50: "#E9E9E9",
      100: "#E5E5E5",
      hub: "#EDF3FC",
      input: "#E2E8F0",
    },
    dark: {
      canvas: "#0D0D0D",
      surface: "#131313",
      surfaceElevated: "#1A1A1A",
      surfaceInput: "#0D0D0D",
      border: "#2E3033",
    },
    semantic: {
      success: "#059669",
      successAlt: "#10B981",
      successLight: "#19C104",
      successDark: "#388E3C",
      error: "#DC2626",
      errorAlt: "#EF4444",
      errorLight: "#FFEBEE",
      errorDark: "#B71C1C",
      errorIos: "#FF3B30",
      errorVivid: "#FF4444",
      warning: "#F59E0B",
      warningAlt: "#E43929",
      info: "#3B82F6",
      deleteRow: "#2E1515",
      deleteSurface: "#1A0D0D",
      softErrorBg: "#FFE5E5",
      softErrorBgAlt: "#FFE6E6",
      softErrorBorder: "#FFCDD2",
    },
    brown: {
      dark: "#382B19",
      medium: "#3E2A09",
      muted: "#6D6250",
      primary: "#341D00",
    },
    overlay: {
      backdrop: "rgba(0, 0, 0, 0.5)",
      backdropAlt: "rgba(0, 0, 0, 0.56)",
    },
    gray: {
      primary: "#FAFAFA",
      800: "#252B37",
      100: "#B9B9B9",
      progressInactive: "#BEBEBE",
      tabInactiveDark: "#777777",
      toastMuted: "#888888",
    },
    input: {
      placeholder: "#686868",
      border: "#E5E5E5",
    },
    streak: {
      lightBg: "#FFF3E0",
      lightBorder: "#FFE0B2",
      darkBg: "#3E2723",
      darkBorder: "#5D4037",
      accentOrange: "#E65100",
      accentCoral: "#FFAB91",
    },
    toast: {
      backgroundLight: "#0A0A0A",
      backgroundDark: "#FFFFFF",
    },
    shadow: {
      default: "#000000",
    },
  },
} as const;

export default Design;

export const BRAND_COLOR = Design.colors.primary.accentDark;
