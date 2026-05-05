import { useMemo } from 'react';
import useUserStore from '@/core/userState';
import {
  Design,
  getBlurTint,
  getStatusBarStyle,
  getThemedColors,
  type ThemeMode,
} from '@/utils/design';

export function useTheme() {
  const theme = useUserStore((s) => s.theme) as ThemeMode;

  return useMemo(() => ({
    isDark: theme === 'dark',
    theme,
    colors: getThemedColors(theme),
    palette: Design.colors,
    spacing: Design.spacing,
    typography: Design.typography,
    statusBarStyle: getStatusBarStyle(theme),
    blurTint: getBlurTint(theme),
  }), [theme]);
}
