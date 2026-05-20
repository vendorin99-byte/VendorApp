import { useThemeStore } from '../store/themeStore'

export function useTheme() {
  const { isDark, toggle } = useThemeStore()
  return {
    isDark,
    toggle,
    bg: isDark ? '#0D0D1A' : '#F9FAFB',
    card: isDark ? '#1A1A2E' : '#FFFFFF',
    cardBorder: isDark ? '#2A2A4A' : '#E5E7EB',
    text: isDark ? '#FFFFFF' : '#1F2937',
    subtext: isDark ? '#9CA3AF' : '#6B7280',
    muted: isDark ? '#6B7280' : '#9CA3AF',
    input: isDark ? '#1A1A2E' : '#FFFFFF',
    inputBorder: isDark ? '#2A2A4A' : '#D1D5DB',
    placeholder: isDark ? '#555580' : '#9CA3AF',
    divider: isDark ? '#2A2A4A' : '#F3F4F6',
    statusBar: (isDark ? 'light-content' : 'dark-content') as 'light-content' | 'dark-content',
    statusBarBg: isDark ? '#0D0D1A' : '#FFFFFF',
    headerBg: isDark ? '#1A1A2E' : '#FFFFFF',
    headerBorder: isDark ? '#2A2A4A' : '#E5E7EB',
  }
}
