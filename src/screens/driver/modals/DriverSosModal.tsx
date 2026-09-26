import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Modal, Button } from '../../../components/common';
import { useTheme } from '../../../theme';

interface DriverSosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriverSosModal: React.FC<DriverSosModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { colors, isLight } = useTheme();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Highway Emergency Assistance & SOS"
      subtitle="Immediate Highway Breakdown & Incident Response"
      icon="🚨"
      actions={
        <Button
          title="Dismiss Emergency Window"
          variant="outline"
          size="md"
          onPress={onClose}
        />
      }
    >
      <View style={styles.body}>
        <View
          style={[
            styles.alertBox,
            {
              backgroundColor: isLight
                ? 'rgba(239, 68, 68, 0.08)'
                : 'rgba(239, 68, 68, 0.15)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            },
          ]}
        >
          <Text style={[styles.alertText, { color: isLight ? '#991b1b' : '#f87171' }]}>
            In the event of an accident, mechanical breakdown, road blockage, or passenger
            emergency, trigger the hotlines below. Dispatch will receive live GPS coordinates.
          </Text>
        </View>

        <View style={styles.contactsGrid}>
          <View
            style={[
              styles.contactCard,
              {
                backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ fontSize: 24 }}>🚨</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>
                National Emergency Support
              </Text>
              <Text style={[styles.contactSub, { color: colors.textSecondary }]}>
                Police / Ambulance / Fire Dispatch
              </Text>
            </View>
            <View style={[styles.dialBadge, { backgroundColor: '#ef4444' }]}>
              <Text style={styles.dialText}>112</Text>
            </View>
          </View>

          <View
            style={[
              styles.contactCard,
              {
                backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ fontSize: 24 }}>🛣️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>
                Highway Patrol & Breakdown
              </Text>
              <Text style={[styles.contactSub, { color: colors.textSecondary }]}>
                NHAI / State Highway Recovery Unit
              </Text>
            </View>
            <View style={[styles.dialBadge, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.dialText}>1033</Text>
            </View>
          </View>

          <View
            style={[
              styles.contactCard,
              {
                backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ fontSize: 24 }}>🏢</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>
                Operator Central Depot Control
              </Text>
              <Text style={[styles.contactSub, { color: colors.textSecondary }]}>
                Regional Transit Operations Desk
              </Text>
            </View>
            <View style={[styles.dialBadge, { backgroundColor: '#2563eb' }]}>
              <Text style={styles.dialText}>HOTLINE</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  body: {
    gap: 14,
  },
  alertBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  alertText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  contactsGrid: {
    gap: 10,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  contactSub: {
    fontSize: 11,
    marginTop: 2,
  },
  dialBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dialText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
  },
});
