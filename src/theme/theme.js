/**
 * AURA — Design System & Theme Engine
 * Ultra-luxury culinary palette inspired by the Stitch AI designs.
 * Dark obsidian surface with warm amber gold accents and botanical emerald secondary.
 * Engineered for seamless light/dark mode transitions.
 */

export const colors = {
  light: {
    // Brand Accents (matching Stitch design primary/secondary)
    primary: '#D97706', // Warm Amber Gold
    primaryDark: '#B45309',
    primaryLight: '#F59E0B',
    secondary: '#10B981', // Emerald Green (dietary/success)
    secondaryLight: '#34D399',
    accent: '#059669', // Deep Jade

    // Background & Surfaces
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
    surfaceBorder: '#E2E8F0',
    surfaceGlow: 'rgba(217, 119, 6, 0.08)',

    // Typography
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',

    // Card & Elevated UI
    card: '#FFFFFF',
    cardBorder: 'rgba(217, 119, 6, 0.12)',
    cardHover: '#F8FAFC',

    // Form Inputs
    inputBackground: '#F8FAFC',
    inputBorder: '#E2E8F0',
    inputFocusBorder: '#D97706',

    // System States
    error: '#E11D48',
    errorBackground: '#FFE4E6',
    success: '#10B981',
    successBackground: '#D1FAE5',
    warning: '#F59E0B',
    warningBackground: '#FEF3C7',

    // Badges & Pills
    badge: '#FEF3C7',
    badgeText: '#B45309',
    goldBadge: '#FEF3C7',
    goldBadgeText: '#B45309',

    // Gradients
    gradientStart: '#F59E0B',
    gradientEnd: '#D97706',
    gradientSurface: ['#FFFFFF', '#F8FAFC'],

    // Tab Bar & Navigation
    tabBar: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    shadowColor: '#0F172A',
  },
  dark: {
    // Brand Accents — exact Stitch AI design tokens
    primary: '#ffc174', // Primary gold text/accent
    primaryDark: '#f59e0b', // Primary container (CTA buttons)
    primaryLight: '#ffddb8', // Primary fixed
    secondary: '#4edea3', // Green secondary
    secondaryLight: '#6ffbbe',
    accent: '#00a572', // Secondary container

    // Background & Surfaces — exact from design CSS
    background: '#0f131c', // surface (main bg)
    surface: '#1c2028', // surface-container (cards)
    surfaceSubtle: '#262a33', // surface-container-high
    surfaceBorder: '#31353e', // surface-container-highest
    surfaceGlow: 'rgba(245, 158, 11, 0.15)',

    // Typography — exact from design
    textPrimary: '#dfe2ee', // on-surface
    textSecondary: '#d8c3ad', // on-surface-variant (warm muted)
    textMuted: '#a08e7a', // outline
    textInverse: '#472a00', // on-primary

    // Card & Elevated UI
    card: '#1c2028', // surface-container
    cardBorder: 'rgba(255, 193, 116, 0.08)', // subtle gold hairline
    cardHover: '#262a33',

    // Form Inputs
    inputBackground: '#0a0e16', // surface-container-lowest
    inputBorder: '#31353e',
    inputFocusBorder: '#ffc174',

    // System States
    error: '#ffb4ab',
    errorBackground: 'rgba(147, 0, 10, 0.3)',
    success: '#4edea3',
    successBackground: 'rgba(0, 165, 114, 0.15)',
    warning: '#ffc174',
    warningBackground: 'rgba(245, 158, 11, 0.15)',

    // Badges & Pills
    badge: 'rgba(245, 158, 11, 0.15)',
    badgeText: '#ffc174',
    goldBadge: 'rgba(245, 158, 11, 0.2)',
    goldBadgeText: '#ffc174',

    // Gradients — amber gold CTA gradient
    gradientStart: '#f59e0b', // primary-container
    gradientEnd: '#ffc174', // primary

    // Tab Bar & Navigation
    tabBar: 'rgba(28, 32, 40, 0.85)',
    tabBarBorder: '#262a33',
    shadowColor: '#000000',
  },
};

export const shadows = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  medium3D: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  deep3D: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  button3D: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  goldGlow: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const typography = {
  titleLarge: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  titleMedium: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  titleSmall: { fontSize: 18, fontWeight: '700' },
  bodyLarge: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  bodyMedium: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  caption: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  button: { fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
};

export default { colors, shadows, typography };
