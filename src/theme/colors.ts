/**
 * RuralBus Design System - Color Tokens
 * Exact golden match to the approved Capacitor UI and RURAL BUS/packages/ui/src/tokens.ts
 */

export const brandColors = {
  // Emerald Brand Primary
  primary: '#00D488',
  primaryDark: '#047857',
  primaryDeep: '#064e3b',
  primaryLight: '#ecfdf5',
  primaryBorder: '#a7f3d0',
  primaryHover: '#00b875',

  // Secondary Accents & Roles
  accent: '#00D488',
  busOrange: '#ea580c',
  busNavy: '#0f172a',
  busEmerald: '#10b981',
  driverBlue: '#2563eb',
  conductorGreen: '#00D488',
  superAdminPurple: '#a855f7',
  superAdminPurpleLight: '#f3e8ff',
  superAdminPurpleBorder: '#d8b4fe',
  ownerGold: '#f59e0b',
} as const;

export const lightColors = {
  // Page & Backgrounds
  background: '#f8fafc', // slate-50
  surface: '#ffffff',
  surfaceAlt: '#f1f5f9',
  card: '#ffffff',
  cardElevated: '#ffffff',
  backdrop: 'rgba(0, 0, 0, 0.75)',

  // Borders
  border: '#cbd5e1', // slate-300
  borderSubtle: '#e2e8f0', // slate-200
  borderStrong: '#94a3b8',
  borderFocus: '#00D488',

  // Typography
  textPrimary: '#0f172a', // slate-900
  textSecondary: '#475569', // slate-600
  textMuted: '#64748b', // slate-500
  textTertiary: '#94a3b8', // slate-400
  textInverse: '#ffffff',
  textBrand: '#047857',

  // Inputs
  inputBackground: '#ffffff',
  inputBorder: '#cbd5e1',
  inputPlaceholder: '#94a3b8',
  inputText: '#0f172a',

  // Header & Navigation
  headerBackground: 'rgba(248, 250, 252, 0.95)',
  headerBorder: 'rgba(203, 213, 225, 0.8)',
  sidebarBackground: '#ffffff',
  sidebarBorder: '#cbd5e1',

  // Navigation Items
  navItemActiveBg: '#ecfdf5',
  navItemActiveBorder: '#059669',
  navItemActiveText: '#047857',
  navItemInactiveText: '#475569',
  navItemInactiveBg: 'transparent',

  // Bottom Nav
  bottomNavBg: '#ffffff',
  bottomNavBorder: '#e2e8f0',

  // Modals
  modalBackground: '#ffffff',
  modalBorder: '#cbd5e1',

  // Mint / Green Badge
  badgeMintBg: '#ecfdf5',
  badgeMintText: '#047857',
  badgeMintBorder: '#a7f3d0',
} as const;

export const darkColors = {
  // Page & Backgrounds
  background: '#0f172a', // slate-900 dark bg
  surface: '#1e293b', // slate-800
  surfaceAlt: '#0a101d',
  card: '#1e293b',
  cardElevated: '#243248',
  backdrop: 'rgba(0, 0, 0, 0.85)',

  // Borders
  border: '#334155', // slate-700
  borderSubtle: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 255, 255, 0.20)',
  borderFocus: '#00D488',

  // Typography
  textPrimary: '#ffffff',
  textSecondary: '#cbd5e1', // slate-300
  textMuted: '#94a3b8', // slate-400
  textTertiary: '#64748b', // slate-500
  textInverse: '#0f172a',
  textBrand: '#00D488',

  // Inputs
  inputBackground: '#111827',
  inputBorder: '#334155',
  inputPlaceholder: '#64748b',
  inputText: '#ffffff',

  // Header & Navigation
  headerBackground: 'rgba(15, 23, 42, 0.95)',
  headerBorder: 'rgba(255, 255, 255, 0.08)',
  sidebarBackground: '#050a0f',
  sidebarBorder: '#1e293b',

  // Navigation Items
  navItemActiveBg: 'rgba(0, 212, 136, 0.12)',
  navItemActiveBorder: '#00D488',
  navItemActiveText: '#00D488',
  navItemInactiveText: '#cbd5e1',
  navItemInactiveBg: 'transparent',

  // Bottom Nav
  bottomNavBg: '#0f172a',
  bottomNavBorder: '#1e293b',

  // Modals
  modalBackground: '#0a101d',
  modalBorder: 'rgba(255, 255, 255, 0.15)',

  // Mint / Green Badge
  badgeMintBg: 'rgba(0, 212, 136, 0.15)',
  badgeMintText: '#00D488',
  badgeMintBorder: 'rgba(0, 212, 136, 0.3)',
} as const;

export const agroColors = {
  // Page & Backgrounds (Dark Agricultural Deep Midnight / Nature Green)
  background: '#071007',
  surface: '#0f200f',
  surfaceAlt: '#142814',
  card: '#0e1c0e',
  cardElevated: '#162b16',
  backdrop: 'rgba(5, 12, 5, 0.88)',

  // Borders
  border: 'rgba(163, 230, 53, 0.22)',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(163, 230, 53, 0.45)',
  borderFocus: '#A3E635',

  // Typography
  textPrimary: '#ffffff',
  textSecondary: '#d1e7d1',
  textMuted: '#8ba58b',
  textTertiary: '#5d775d',
  textInverse: '#071007',
  textBrand: '#A3E635',

  // Inputs
  inputBackground: '#0b160b',
  inputBorder: 'rgba(163, 230, 53, 0.30)',
  inputPlaceholder: '#6e8a6e',
  inputText: '#ffffff',

  // Header & Navigation
  headerBackground: 'rgba(7, 16, 7, 0.95)',
  headerBorder: 'rgba(163, 230, 53, 0.15)',
  sidebarBackground: '#050c05',
  sidebarBorder: 'rgba(163, 230, 53, 0.18)',

  // Navigation Items
  navItemActiveBg: 'rgba(163, 230, 53, 0.15)',
  navItemActiveBorder: '#A3E635',
  navItemActiveText: '#A3E635',
  navItemInactiveText: '#8ba58b',
  navItemInactiveBg: 'transparent',

  // Bottom Nav
  bottomNavBg: '#081208',
  bottomNavBorder: 'rgba(163, 230, 53, 0.20)',

  // Modals
  modalBackground: '#0a150a',
  modalBorder: 'rgba(163, 230, 53, 0.30)',

  // Mint / Lime Badges
  badgeMintBg: 'rgba(163, 230, 53, 0.14)',
  badgeMintText: '#A3E635',
  badgeMintBorder: 'rgba(163, 230, 53, 0.35)',

  // Direct Agro Highlights
  lime: '#A3E635',
  limeLight: '#bef264',
  limeDark: '#65a30d',
  limeGlow: 'rgba(163, 230, 53, 0.25)',
} as const;

export const statusColors = {
  success: '#10b981',
  successBg: 'rgba(16, 185, 129, 0.12)',
  successBorder: 'rgba(16, 185, 129, 0.30)',
  warning: '#f59e0b',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  warningBorder: 'rgba(245, 158, 11, 0.35)',
  danger: '#e11d48',
  dangerBg: 'rgba(225, 29, 72, 0.12)',
  dangerBorder: 'rgba(225, 29, 72, 0.35)',
  info: '#2563eb',
  infoBg: 'rgba(37, 99, 235, 0.12)',
  infoBorder: 'rgba(37, 99, 235, 0.30)',
  neutral: '#64748b',
  neutralBg: 'rgba(100, 116, 139, 0.12)',
  neutralBorder: 'rgba(100, 116, 139, 0.25)',
} as const;

export type ThemeColors = typeof lightColors;
