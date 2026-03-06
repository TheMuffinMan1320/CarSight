import { Colors, AppColors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Returns semantic theme tokens derived from the current color scheme.
 *
 * Usage:
 *   const { isDark, colors, tint, fonts } = useAppTheme();
 */
export function useAppTheme() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  return {
    isDark,
    colors: AppColors[colorScheme],
    tint: Colors[colorScheme].tint,
    fonts: Fonts,
  };
}
