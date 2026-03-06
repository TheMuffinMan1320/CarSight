/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

/**
 * Semantic app-level color tokens for light and dark mode.
 * Use with the useAppTheme() hook.
 */
export const AppColors = {
  light: {
    pageBg: '#F6F6FA',          // screen background
    surface: '#FFFFFF',          // cards, rows
    modalBg: '#FFFFFF',          // bottom sheets / modals
    inputBg: '#F5F5F8',          // text input backgrounds
    subtleBg: '#F0F0F8',         // icon wrappers, image placeholders, chart track
    avatarBg: '#E8E8F0',         // avatar circles
    searchBg: '#EBEBF0',         // search bars, header borders, grid placeholders
    chipBg: '#EBEBEB',           // filter / sort chips
    divider: '#EBEBEB',          // section dividers
    separator: '#F0F0F4',        // thin separators within cards / list items
    borderSubtle: '#E0E0E8',     // subtle borders (photo picker, disabled btn)
    textPrimary: '#11181C',
    textSecondary: '#687076',
    textPlaceholder: '#A0AEC0',
    iconOnTint: '#FFFFFF',       // icon / text rendered on a tint-coloured surface
    iconInactive: '#C7C7CC',     // inactive close / dismiss icons
    switchTrackOff: '#D1D1D6',   // switch track (off state) and handle bar
    photographyBg: '#F3E8FF',    // photographer badge background
  },
  dark: {
    pageBg: '#0F0F17',
    surface: '#1C1C2E',
    modalBg: '#151718',
    inputBg: '#252538',
    subtleBg: '#252538',
    avatarBg: '#252538',
    searchBg: '#1C1C2E',
    chipBg: '#1C1C2E',
    divider: '#2A2A3E',
    separator: '#252538',
    borderSubtle: '#252538',
    textPrimary: '#ECEDEE',
    textSecondary: '#9BA1A6',
    textPlaceholder: '#4A5568',
    iconOnTint: '#11181C',
    iconInactive: '#3A3A4E',
    switchTrackOff: '#3A3A4E',
    photographyBg: '#2A1A3E',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
