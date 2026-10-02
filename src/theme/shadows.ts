/**
 * RuralBus Design System - Shadow Tokens (Cross-Platform RN + Web)
 * Supports standard CSS boxShadow on Web to eliminate RNW deprecation warnings,
 * while maintaining native shadowColor/elevation on iOS/Android.
 */

import { Platform, ViewStyle } from 'react-native';

export interface ShadowToken extends ViewStyle {
  boxShadow?: string;
}

export const shadows: Record<'none' | 'subtle' | 'card' | 'elevated' | 'modal' | 'glow', ShadowToken> = {
  none: Platform.OS === 'web'
    ? ({ boxShadow: 'none' } as any)
    : {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      },
  subtle: Platform.OS === 'web'
    ? ({ boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' } as any)
    : {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
      },
  card: Platform.OS === 'web'
    ? ({ boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)' } as any)
    : {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
      },
  elevated: Platform.OS === 'web'
    ? ({ boxShadow: '0 8px 20px rgba(15, 23, 42, 0.10)' } as any)
    : {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 4,
      },
  modal: Platform.OS === 'web'
    ? ({ boxShadow: '0 16px 32px rgba(0, 0, 0, 0.25)' } as any)
    : {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.25,
        shadowRadius: 32,
        elevation: 10,
      },
  glow: Platform.OS === 'web'
    ? ({ boxShadow: '0 0 16px rgba(0, 212, 136, 0.35)' } as any)
    : {
        shadowColor: '#00D488',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 3,
      },
};
