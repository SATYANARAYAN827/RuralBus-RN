/**
 * Bus Approved Notification Modal
 * Displays a congratulatory confirmation when Super Admin approves the operator's pending bus.
 * Strictly credential/tenant isolated: only the requesting operator sees this.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal, Button, Badge } from '../../../components/common';
import { useTheme } from '../../../theme';
import { AppNotification } from '../../../stores/notification.store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onViewFleet: () => void;
  notification: AppNotification | null;
}

export const BusApprovedModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onViewFleet,
  notification,
}) => {
  const { colors, isLight } = useTheme();

  if (!notification) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🎉 Bus Approved for Service!"
      subtitle="Super Admin Platform Verification Complete"
      icon="🚌"
      actions={
        <View style={styles.actionRow}>
          <Button
            title="Dismiss"
            variant="outline"
            size="md"
            onPress={onClose}
          />
          <Button
            title="View Fleet Buses ➔"
            variant="mint"
            size="md"
            onPress={onViewFleet}
          />
        </View>
      }
    >
      <View style={styles.container}>
        {/* Approved Vehicle Card */}
        <View
          style={[
            styles.approvedCard,
            {
              backgroundColor: isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.12)',
              borderColor: '#00D488',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={{ fontSize: 28 }}>🚌</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.busTitle, { color: isLight ? '#065f46' : '#ffffff' }]}>
                {notification.busReg || 'Fleet Vehicle'}
              </Text>
              <Text style={[styles.busSub, { color: isLight ? '#047857' : '#a7f3d0' }]}>
                {notification.busModel || 'Commercial Transit Coach'}
              </Text>
            </View>
            <Badge label="ACTIVE" variant="mint" size="sm" />
          </View>
        </View>

        {/* Message body */}
        <View style={styles.textBox}>
          <Text style={[styles.greeting, { color: colors.textPrimary }]}>
            Permit Approved & Activated
          </Text>
          <Text style={[styles.mainMessage, { color: colors.textSecondary }]}>
            {notification.message}
          </Text>
        </View>

        {/* Next actions callout */}
        <View
          style={[
            styles.nextStepsCard,
            {
              backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)',
              borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
            },
          ]}
        >
          <Text style={[styles.nextStepsTitle, { color: colors.textPrimary }]}>
            🚀 What you can do next:
          </Text>
          <Text style={[styles.stepItem, { color: colors.textSecondary }]}>
            1. Assign an active Driver and Conductor in Fleet Buses or Staff Roster.
          </Text>
          <Text style={[styles.stepItem, { color: colors.textSecondary }]}>
            2. Link this vehicle to your approved corridor routes and daily timetables.
          </Text>
          <Text style={[styles.stepItem, { color: colors.textSecondary }]}>
            3. Dispatch trips with digital seat ticketing and live tracking telemetry.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    gap: 14,
  },
  approvedCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  busTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  busSub: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  textBox: {
    paddingHorizontal: 2,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  mainMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  nextStepsCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  nextStepsTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  stepItem: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    gap: 10,
  },
});
