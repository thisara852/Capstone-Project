// Design Tokens for IEEE CompConnect
// Dark blue premium theme inspired by IEEE brand identity

export const Colors = {
  // Primary Palette
  primary: '#1A73E8',
  primaryDark: '#1557B0',
  primaryLight: '#4A9EFF',
  accent: '#1A73E8',
  accentGold: '#D97706',

  // Background
  bgDark: '#FFFFFF',
  bgCard: '#F8FAFC',
  bgCardAlt: '#F1F5F9',
  bgSurface: '#E2E8F0',
  bgOverlay: 'rgba(255, 255, 255, 0.85)',

  // Text
  textPrimary: '#1A73E8',
  textSecondary: '#1E3A8A',
  textMuted: '#64748B',
  textAccent: '#1A73E8',

  // Status
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',

  // Gradients (used as array for LinearGradient)
  gradientPrimary: ['#1A73E8', '#1557B0'],
  gradientDark: ['#FFFFFF', '#F8FAFC'],
  gradientCard: ['#FFFFFF', '#F8FAFC'],
  gradientGold: ['#D97706', '#B45309'],

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
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
