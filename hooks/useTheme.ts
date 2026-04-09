import { useMemo } from 'react';
import useUserStore from '@/core/userState';
import { Design } from '@/utils/design';

export function useTheme() {
  const theme = useUserStore((s) => s.theme);

  return useMemo(() => ({
    isDark: theme === 'dark',
    theme,
    colors: Design.colors,
    spacing: Design.spacing,
    typography: Design.typography,
  }), [theme]);
}
