import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { LanguageCode } from '../../types';

const LANGUAGES: { code: LanguageCode; label: string; nativeName: string }[] = [
  { code: 'EN', label: 'English', nativeName: 'English' },
  { code: 'OD', label: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'HI', label: 'Hindi', nativeName: 'हिंदी' },
];

export interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
  const { isLight, borderRadius, shadows } = useTheme();
  const { lang, setLang } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <View style={styles.wrapper}>
      {/* Floating Pill Trigger */}
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
        style={[
          styles.pillButton,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
            borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.18)',
            borderWidth: 1.5,
            borderRadius: borderRadius.pill,
            paddingVertical: compact ? 6 : 7,
            paddingHorizontal: compact ? 10 : 16,
            // @ts-ignore
            boxShadow: isLight ? '0 2px 8px rgba(0, 0, 0, 0.08)' : '0 4px 14px rgba(0, 0, 0, 0.4)',
          },
        ]}
        accessibilityLabel="Change app language"
      >
        <Text style={styles.globeIcon}>🌐</Text>
        <Text
          style={[
            styles.pillLabel,
            { color: isLight ? '#0f172a' : '#f8fafc' },
          ]}
        >
          {currentLang.nativeName}
        </Text>
        <Text style={[styles.arrowIcon, { color: isLight ? '#64748b' : '#94a3b8' }]}>⌵</Text>
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          />
          <View
            style={[
              styles.dropdownMenu,
              {
                backgroundColor: isLight ? '#ffffff' : '#1e293b',
                borderColor: isLight ? '#cbd5e1' : '#334155',
                borderRadius: 16,
                ...(isLight ? shadows.elevated : shadows.modal),
              },
            ]}
          >
            <Text
              style={[
                styles.menuTitle,
                { color: isLight ? '#64748b' : '#94a3b8' },
              ]}
            >
              Select Language
            </Text>

            {LANGUAGES.map((l) => {
              const isSelected = l.code === lang;
              return (
                <TouchableOpacity
                  key={l.code}
                  onPress={() => {
                    setLang(l.code);
                    setIsOpen(false);
                  }}
                  activeOpacity={0.7}
                  style={[
                    styles.langItem,
                    {
                      backgroundColor: isSelected
                        ? isLight
                          ? '#ecfdf5'
                          : 'rgba(0, 212, 136, 0.15)'
                        : 'transparent',
                      borderColor: isSelected
                        ? isLight
                          ? '#a7f3d0'
                          : 'rgba(0, 212, 136, 0.3)'
                        : 'transparent',
                    },
                  ]}
                >
                  <View>
                    <Text
                      style={[
                        styles.nativeNameText,
                        {
                          color: isSelected
                            ? isLight
                              ? '#047857'
                              : '#00D488'
                            : isLight
                            ? '#0f172a'
                            : '#ffffff',
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {l.nativeName}
                    </Text>
                    <Text
                      style={[
                        styles.englishNameText,
                        { color: isLight ? '#64748b' : '#94a3b8' },
                      ]}
                    >
                      {l.label}
                    </Text>
                  </View>

                  {isSelected && (
                    <Text style={{ color: '#00D488', fontSize: 16, fontWeight: '900' }}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 6,
  },
  globeIcon: {
    fontSize: 14,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  arrowIcon: {
    fontSize: 11,
    marginTop: -2,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dropdownMenu: {
    width: '100%',
    maxWidth: 280,
    borderWidth: 1.5,
    padding: 12,
    gap: 6,
  },
  menuTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  nativeNameText: {
    fontSize: 15,
  },
  englishNameText: {
    fontSize: 11,
    marginTop: 1,
  },
});
