import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../theme';
import { Modal, Button } from '../../../components/common';
import { LanguageCode } from '../../../types';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage?: LanguageCode;
  onSelectLanguage?: (code: LanguageCode) => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
  isOpen,
  onClose,
  currentLanguage = 'EN',
  onSelectLanguage,
}) => {
  const { colors, isLight } = useTheme();
  const [selected, setSelected] = useState<LanguageCode>(currentLanguage);

  const languages: { code: LanguageCode; label: string; sublabel: string }[] = [
    { code: 'EN', label: 'English (Default)', sublabel: 'State Transit Support' },
    { code: 'OD', label: 'ଓଡ଼ିଆ (Odia)', sublabel: 'ରାଜ୍ୟ ପରିବହନ ସହାୟତା' },
    { code: 'HI', label: 'हिंदी (Hindi)', sublabel: 'राज्य परिवहन सहायता' },
  ];

  const handleApply = () => {
    if (onSelectLanguage) onSelectLanguage(selected);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Language"
      subtitle="Select preferred interface language"
      icon="🌐"
      maxWidth={460}
    >
      <View style={styles.container}>
        {languages.map((lang) => {
          const isSelected = selected === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              onPress={() => setSelected(lang.code)}
              style={[
                styles.langCard,
                {
                  backgroundColor: isSelected
                    ? (isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.12)')
                    : (isLight ? '#ffffff' : '#1e293b'),
                  borderColor: isSelected
                    ? '#00D488'
                    : (isLight ? '#e2e8f0' : '#334155'),
                },
              ]}
            >
              <View style={styles.langInfo}>
                <Text
                  style={[
                    styles.langLabel,
                    { color: isSelected ? '#047857' : colors.textPrimary },
                  ]}
                >
                  {lang.label}
                </Text>
                <Text style={[styles.langSublabel, { color: colors.textSecondary }]}>
                  {lang.sublabel}
                </Text>
              </View>
              {isSelected && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.infoText, { color: colors.textMuted }]}>
          Stoppage names and schedules are localized where available. Additional vernacular support is actively rolled out.
        </Text>

        <Button
          title="Apply Language"
          variant="primary"
          size="lg"
          onPress={handleApply}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  langInfo: {
    flex: 1,
  },
  langLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  langSublabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '900',
    color: '#00D488',
    marginLeft: 10,
  },
  infoText: {
    fontSize: 11,
    lineHeight: 16,
    marginVertical: 4,
  },
});
