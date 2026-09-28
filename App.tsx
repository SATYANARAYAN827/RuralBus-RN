import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { RoleRouter } from './src/navigation/RoleRouter';

/**
 * RuralBus React Native Application Root
 * Module 1: Shared Foundation (Design Tokens, Components, Responsive Shell & Navigation)
 */
export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'RuralBus';
    }
  }, []);

  return <RoleRouter />;
}
