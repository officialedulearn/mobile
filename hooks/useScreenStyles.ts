import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './useTheme';
import { Design, getScreenTopPadding } from '@/utils/design';

export function useScreenStyles() {
  const { isDark, colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const topPadding = getScreenTopPadding(insets);

  return useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: isDark ? colors.dark.canvas : colors.background.canvas,
      paddingTop: topPadding,
    },
    scrollContent: {
      flexDirection: 'column' as const,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
    },
    surface: {
      backgroundColor: isDark ? colors.dark.surface : colors.background.white,
      borderColor: isDark ? colors.dark.border : colors.border.default,
    },
    text: {
      primary: isDark ? colors.text.darkPrimary : colors.text.primary,
      secondary: isDark ? colors.text.darkSecondary : colors.text.secondary,
      tertiary: isDark ? colors.text.darkTertiary : colors.text.tertiary,
    },
  }), [isDark, colors, spacing, topPadding]);
}
