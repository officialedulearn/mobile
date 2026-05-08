import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "./useTheme";
import { Design, getScreenTopPadding } from "@/utils/design";

export function useScreenStyles() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const topPadding = getScreenTopPadding(insets);

  return useMemo(
    () => ({
      container: {
        flex: 1,
        backgroundColor: colors.canvas,
        paddingTop: topPadding,
      },
      scrollContent: {
        flexDirection: "column" as const,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
      },
      surface: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      },
      text: {
        primary: colors.textPrimary,
        secondary: colors.textSecondary,
        tertiary: colors.textTertiary,
      },
    }),
    [colors, spacing, topPadding],
  );
}
