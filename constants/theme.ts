// Design Tokens for IEEE CompConnect
// Dark blue premium theme inspired by IEEE brand identity

export const Colors = {
  // Primary Palette
  primary: '#1A73E8',
  primaryDark: '#1557B0',
  primaryLight: '#4A9EFF',
  accent: '#00D4FF',
  accentGold: '#FFB800',

  // Background
  bgDark: '#0A0F1E',
  bgCard: '#111827',
  bgCardAlt: '#1A2035',
  bgSurface: '#1E2A40',
  bgOverlay: 'rgba(10, 15, 30, 0.85)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textAccent: '#00D4FF',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Gradients (used as array for LinearGradient)
  gradientPrimary: ['#1A73E8', '#00D4FF'],
  gradientDark: ['#0A0F1E', '#111827'],
  gradientCard: ['#1A2035', '#111827'],
  gradientGold: ['#FFB800', '#FF6B00'],

  // Borders
  border: '#1E2A40',
  borderLight: '#2D3748',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};
