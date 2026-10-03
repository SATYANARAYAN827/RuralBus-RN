import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../theme';
import { Modal, Button } from '../../../components/common';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { colors, isLight, isAgro, theme, setTheme } = useTheme();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Visual Themes"
      subtitle="Customize your passenger portal look and feel"
      icon="🎨"
      maxWidth={480}
    >
      <View style={styles.container}>
        {/* Agro Lime Edition (Recommended) */}
        <TouchableOpacity
          onPress={() => setTheme('agro')}
          style={[
            styles.themeCard,
            {
              backgroundColor: isAgro
                ? 'rgba(163, 230, 53, 0.14)'
                : isLight
                ? '#ffffff'
                : '#0e1c0e',
              borderColor: isAgro
                ? '#A3E635'
                : isLight
                ? '#e2e8f0'
                : 'rgba(163, 230, 53, 0.25)',
            },
          ]}
        >
          <View style={styles.cardContent}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>🌿</Text>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.themeTitle, { color: isAgro ? '#A3E635' : colors.textPrimary }]}>
                  Agro Field Lime
                </Text>
                <View style={styles.recomBadge}>
                  <Text style={styles.recomBadgeText}>RECOMMENDED</Text>
                </View>
              </View>
              <Text style={[styles.themeDesc, { color: colors.textSecondary }]}>
                Deep organic forest green with high-contrast electric lime accents
              </Text>
            </View>
            {isAgro && <Text style={[styles.checkmark, { color: '#A3E635' }]}>✓</Text>}
          </View>
        </TouchableOpacity>

        {/* Dark Mode */}
        <TouchableOpacity
          onPress={() => setTheme('dark')}
          style={[
            styles.themeCard,
            {
              backgroundColor: theme === 'dark'
                ? 'rgba(0, 212, 136, 0.12)'
                : isLight
                ? '#ffffff'
                : '#1e293b',
              borderColor: theme === 'dark'
                ? '#00D488'
                : '#334155',
            },
          ]}
        >
          <View style={styles.cardContent}>
            <Text style={{ fontSize: 22, marginRight: 12 }}>🌙</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.themeTitle, { color: theme === 'dark' ? '#00D488' : colors.textPrimary }]}>
                Soft Slate Dark
              </Text>
              <Text style={[styles.themeDesc, { color: colors.textSecondary }]}>
                Comfortable low-glare slate midnight appearance
              </Text>
            </View>
            {theme === 'dark' && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        {/* Light Mode */}
        <TouchableOpacity
          onPress={() => setTheme('light')}
          style={[
            styles.themeCard,
            {
              backgroundColor: isLight
                ? '#ecfdf5'
                : '#1e293b',
              borderColor: isLight
                ? '#047857'
                : '#334155',
            },
          ]}
        >
          <View style={styles.cardContent}>
            <Text style={{ fontSize: 22, marginRight: 12 }}>☀️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.themeTitle, { color: isLight ? '#047857' : colors.textPrimary }]}>
                Ice White Light
              </Text>
              <Text style={[styles.themeDesc, { color: colors.textSecondary }]}>
                Clean daytime high-contrast appearance
              </Text>
            </View>
            {isLight && <Text style={[styles.checkmark, { color: '#047857' }]}>✓</Text>}
          </View>
        </TouchableOpacity>

        {/* System notice */}
        <View
          style={[
            styles.noticeBox,
            {
              backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
              borderColor: isLight ? '#e2e8f0' : '#334155',
            },
          ]}
        >
          <Text style={{ fontSize: 16, marginRight: 8 }}>📲</Text>
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
            Android & iOS system theme changes update automatically in real time without reload.
          </Text>
        </View>

        <Button
          title="Done"
          variant="primary"
          size="lg"
          onPress={onClose}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  themeCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  themeDesc: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '900',
    color: '#00D488',
    marginLeft: 10,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  recomBadge: {
    backgroundColor: 'rgba(163, 230, 53, 0.20)',
    borderColor: '#A3E635',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 9999,
  },
  recomBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A3E635',
    letterSpacing: 0.5,
  },
});
