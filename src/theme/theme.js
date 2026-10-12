/**
 * src/theme/theme.js
 * ═══════════════════════════════════════════════════════════
 * AURA Restaurant App — Design Tokens & Theme Engine
 * Strict implementation of light and dark tokens, Poppins typography,
 * elevation, and spacing system.
 * ═══════════════════════════════════════════════════════════
 */

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
};

export const colors = {
  light: {
    // Brand Tokens
    primary: '#FC5834',
    primaryPressed: '#E04A27',
    primaryTint: '#FFEDE8',
    onPrimary: '#FFFFFF',

    // Surfaces & Backgrounds
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSubtle: '#F7F7F7',
    card: '#F7F7F7',

    // Borders & Dividers
    border: '#B7B7B7',
    disabled: '#B7B7B7',
    subtleBorder: '#E8E8E8',
    surfaceBorder: '#E8E8E8',
    cardBorder: '#E8E8E8',

    // Typography
    text: '#2A2A2A',
    textPrimary: '#2A2A2A',
    textSecondary: '#4A4A4A',
    mutedText: '#767676',
    placeholder: '#767676',

    // Input States
    inputBackground: '#FFFFFF',
    inputBorder: '#E8E8E8',
    inputFocusBorder: '#FC5834',

    // Status Tokens (Never use primary color for status)
    pending: '#F59E0B',
    pendingTint: 'rgba(245, 158, 11, 0.12)',
    preparing: '#2563EB',
    preparingTint: 'rgba(37, 99, 235, 0.12)',
    ready: '#16A34A',
    readyTint: 'rgba(22, 163, 74, 0.12)',
    served: '#16A34A',
    servedTint: 'rgba(22, 163, 74, 0.12)',
    confirmed: '#16A34A',
    confirmedTint: 'rgba(22, 163, 74, 0.12)',
    cancelled: '#DC2626',
    cancelledTint: 'rgba(220, 38, 38, 0.12)',
    declined: '#DC2626',
    declinedTint: 'rgba(220, 38, 38, 0.12)',
    error: '#DC2626',
    errorTint: 'rgba(220, 38, 38, 0.12)',
    success: '#16A34A',
    successTint: 'rgba(22, 163, 74, 0.12)',

    // Navigation & Tab Bar
    tabBar: '#FFFFFF',
    tabBarBorder: '#E8E8E8',
    shadowColor: '#000000',

    // Gradient helper
    gradientPrimary: ['#FC5834', '#E04A27'],
  },
  dark: {
    // Brand Tokens
    primary: '#FF6B4A',
    primaryPressed: '#FF8266',
    primaryTint: '#3A1F18',
    onPrimary: '#FFFFFF',

    // Surfaces & Backgrounds
    background: '#121212',
    surface: '#1E1E1E',
    surfaceSubtle: '#181818',
    card: '#1E1E1E',

    // Borders & Dividers
    border: '#3A3A3A',
    disabled: '#4A4A4A',
    subtleBorder: '#2C2C2C',
    surfaceBorder: '#2C2C2C',
    cardBorder: '#2C2C2C',

    // Typography
    text: '#F5F5F5',
    textPrimary: '#F5F5F5',
    textSecondary: '#D0D0D0',
    mutedText: '#A0A0A0',
    placeholder: '#A0A0A0',

    // Input States
    inputBackground: '#181818',
    inputBorder: '#2C2C2C',
    inputFocusBorder: '#FF6B4A',

    // Status Tokens (Tint at 20% opacity in dark)
    pending: '#F59E0B',
    pendingTint: 'rgba(245, 158, 11, 0.20)',
    preparing: '#2563EB',
    preparingTint: 'rgba(37, 99, 235, 0.20)',
    ready: '#16A34A',
    readyTint: 'rgba(22, 163, 74, 0.20)',
    served: '#16A34A',
    servedTint: 'rgba(22, 163, 74, 0.20)',
    confirmed: '#16A34A',
    confirmedTint: 'rgba(22, 163, 74, 0.20)',
    cancelled: '#DC2626',
    cancelledTint: 'rgba(220, 38, 38, 0.20)',
    declined: '#DC2626',
    declinedTint: 'rgba(220, 38, 38, 0.20)',
    error: '#DC2626',
    errorTint: 'rgba(220, 38, 38, 0.20)',
    success: '#16A34A',
    successTint: 'rgba(22, 163, 74, 0.20)',

    // Navigation & Tab Bar
    tabBar: '#181818',
    tabBarBorder: '#2C2C2C',
    shadowColor: '#000000',

    // Gradient helper
    gradientPrimary: ['#FF6B4A', '#FF8266'],
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  input: 12,
  button: 14,
  card: 20,
  sheet: 28,
  pill: 999,
};

export const shadows = {
  cardLight: {
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardDark: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderWidth: 1,
  },
  buttonPrimary: {
    shadowColor: 'rgba(252, 88, 52, 0.35)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  raisedTrayTab: {
    shadowColor: 'rgba(252, 88, 52, 0.40)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const typography = {
  display: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  headingLg: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  headingSm: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    fontFamily: fonts.regular,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    fontFamily: fonts.regular,
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    fontFamily: fonts.semiBold,
  },
  price: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },
};

export default { colors, fonts, spacing, radius, shadows, typography };
