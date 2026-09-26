/**
 * RuralBus Design System - Typography Tokens
 */

export const fontSizes = {
  xs: 10,
  sm: 11,
  caption: 12,
  sub: 13,
  body: 14,
  base: 15,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
} as const;

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
  black: '900' as const,
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
} as const;

export const letterSpacings = {
  tighter: -0.5,
  tight: -0.3,
  normal: 0,
  wide: 0.3,
  wider: 0.5,
  widest: 1,
} as const;

export const typography = {
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
};
