import { useMemo } from 'react';
import { useTheme } from './useTheme';
import { Design } from '@/utils/design';

export function useScreenStyles() {
  const { isDark, colors, spacing } = useTheme();

  return useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: isDark ? colors.dark.canvas : colors.background.canvas,
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
  }), [isDark, colors, spacing]);
}
