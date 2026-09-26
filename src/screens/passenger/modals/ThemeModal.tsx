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
  const { colors, isLight, setTheme } = useTheme();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Themes"
      subtitle="Customize visual appearance"
      icon="🎨"
      maxWidth={460}
    >
      <View style={styles.container}>
        {/* Dark Mode */}
        <TouchableOpacity
          onPress={() => setTheme('dark')}
          style={[
            styles.themeCard,
            {
              backgroundColor: !isLight
                ? 'rgba(0, 212, 136, 0.12)'
                : '#ffffff',
              borderColor: !isLight
                ? '#00D488'
                : '#e2e8f0',
            },
          ]}
        >
          <View style={styles.cardContent}>
            <Text style={{ fontSize: 22, marginRight: 12 }}>🌙</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.themeTitle, { color: !isLight ? '#00D488' : colors.textPrimary }]}>
                Dark Mode
              </Text>
              <Text style={[styles.themeDesc, { color: colors.textSecondary }]}>
                Soft Slate comfortable dark appearance
              </Text>
            </View>
            {!isLight && <Text style={styles.checkmark}>✓</Text>}
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
                ? '#00D488'
                : '#334155',
            },
          ]}
        >
          <View style={styles.cardContent}>
            <Text style={{ fontSize: 22, marginRight: 12 }}>☀️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.themeTitle, { color: isLight ? '#047857' : colors.textPrimary }]}>
                Light Mode
              </Text>
              <Text style={[styles.themeDesc, { color: colors.textSecondary }]}>
                Ice White clean daytime appearance
              </Text>
            </View>
            {isLight && <Text style={styles.checkmark}>✓</Text>}
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
});
