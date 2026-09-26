import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { useTheme } from '../../../theme';
import { Modal, Button } from '../../../components/common';

interface SosEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SosEmergencyModal: React.FC<SosEmergencyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { colors, isLight } = useTheme();
  const [dialedNumber, setDialedNumber] = useState<string | null>(null);

  const handleDial = (number: string) => {
    setDialedNumber(number);
    if (Platform.OS !== 'web') {
      Linking.openURL(`tel:${number}`).catch(() => {});
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setDialedNumber(null);
        onClose();
      }}
      title="Emergency Assistance (SOS)"
      subtitle="Verified Official Helplines"
      icon="🚨"
      maxWidth={480}
    >
      <View style={styles.container}>
        {/* National Emergency 112 */}
        <View
          style={[
            styles.helplineCard,
            {
              backgroundColor: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.12)',
              borderColor: isLight ? '#fecaca' : '#7f1d1d',
            },
          ]}
        >
          <View style={styles.helplineInfo}>
            <Text style={[styles.helplineNumber, { color: '#dc2626' }]}>
              📞 112 · National Emergency
            </Text>
            <Text style={[styles.helplineDesc, { color: colors.textSecondary }]}>
              Police, Fire, Medical & Disaster Response (24×7)
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDial('112')}
            style={[styles.dialButton, { backgroundColor: '#dc2626' }]}
          >
            <Text style={styles.dialButtonText}>DIAL</Text>
          </TouchableOpacity>
        </View>

        {/* Women Helpline 181 */}
        <View
          style={[
            styles.helplineCard,
            {
              backgroundColor: isLight ? '#fdf2f8' : 'rgba(236, 72, 153, 0.12)',
              borderColor: isLight ? '#fbcfe8' : '#831843',
            },
          ]}
        >
          <View style={styles.helplineInfo}>
            <Text style={[styles.helplineNumber, { color: '#db2777' }]}>
              🛡️ 181 · Women Helpline
            </Text>
            <Text style={[styles.helplineDesc, { color: colors.textSecondary }]}>
              Emergency support & women safety helpline (Toll-Free)
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDial('181')}
            style={[styles.dialButton, { backgroundColor: '#db2777' }]}
          >
            <Text style={styles.dialButtonText}>DIAL</Text>
          </TouchableOpacity>
        </View>

        {/* Ambulance 108 */}
        <View
          style={[
            styles.helplineCard,
            {
              backgroundColor: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.12)',
              borderColor: isLight ? '#fde68a' : '#78350f',
            },
          ]}
        >
          <View style={styles.helplineInfo}>
            <Text style={[styles.helplineNumber, { color: '#d97706' }]}>
              🚑 108 · Medical Ambulance
            </Text>
            <Text style={[styles.helplineDesc, { color: colors.textSecondary }]}>
              State rural ambulance & highway emergency fleet
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDial('108')}
            style={[styles.dialButton, { backgroundColor: '#d97706' }]}
          >
            <Text style={styles.dialButtonText}>DIAL</Text>
          </TouchableOpacity>
        </View>

        {dialedNumber && (
          <View style={styles.dialAlert}>
            <Text style={[styles.dialAlertText, { color: '#047857' }]}>
              Initiating emergency direct call to {dialedNumber}...
            </Text>
          </View>
        )}

        {/* Disclaimer footer */}
        <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
          Tapping initiates a phone call directly from your device. RuralBus does not record or intercept emergency communications.
        </Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  helplineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  helplineInfo: {
    flex: 1,
    marginRight: 10,
  },
  helplineNumber: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  helplineDesc: {
    fontSize: 12,
    fontWeight: '500',
  },
  dialButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dialButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dialAlert: {
    padding: 10,
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
  },
  dialAlertText: {
    fontSize: 12,
    fontWeight: '700',
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    textAlign: 'center',
  },
});
