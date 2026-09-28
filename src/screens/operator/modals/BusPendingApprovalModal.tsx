/**
 * Bus Pending Approval Confirmation Modal
 * Displayed to the operator immediately after successfully submitting a new bus registration.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal, Button, Badge } from '../../../components/common';
import { useTheme } from '../../../theme';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  busReg?: string;
  busModel: string;
  totalSeats: number;
}

export const BusPendingApprovalModal: React.FC<Props> = ({
  isOpen,
  onClose,
  busReg,
  busModel,
  totalSeats,
}) => {
  const { colors, isLight } = useTheme();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bus Registration Submitted"
      subtitle="Pending Platform Super Admin Approval"
      icon="⏳"
      actions={
        <Button
          title="Understood • View Fleet Buses"
          variant="primary"
          size="md"
          onPress={onClose}
          style={{ width: '100%' }}
        />
      }
    >
      <View style={styles.container}>
        {/* Status Callout Card */}
        <View
          style={[
            styles.vehicleCard,
            {
              backgroundColor: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.12)',
              borderColor: '#f59e0b',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={{ fontSize: 24 }}>🚌</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.vehicleTitle, { color: isLight ? '#92400e' : '#fde68a' }]}>
                {busReg || 'Registration Plate Pending'}
              </Text>
              <Text style={[styles.vehicleSub, { color: isLight ? '#78350f' : '#fef3c7' }]}>
                {busModel} • {totalSeats} Seats
              </Text>
            </View>
            <Badge label="PENDING APPROVAL" variant="warning" size="sm" />
          </View>
        </View>

        {/* Informational Message */}
        <View style={styles.infoBox}>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
            📋 Governance Verification Required
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your bus has been successfully registered in the platform database with status{' '}
            <Text style={{ fontWeight: '700', color: '#f59e0b' }}>PENDING_APPROVAL</Text>.
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary, marginTop: 8 }]}>
            A permit approval request has been transmitted directly to the{' '}
            <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
              State Transport Super Admin
            </Text>
            . Once reviewed and activated, an in-app confirmation will be delivered exclusively to your operator account.
          </Text>
        </View>

        {/* Feature restriction notice */}
        <View
          style={[
            styles.noticeRow,
            {
              backgroundColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)',
              borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
            },
          ]}
        >
          <Text style={{ fontSize: 16 }}>ℹ️</Text>
          <Text style={[styles.noticeText, { color: colors.textMuted }]}>
            You can still pre-assign standby drivers or view this bus in your Fleet Roster. It will become operational once approved.
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
  vehicleCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  vehicleSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  infoBox: {
    paddingHorizontal: 4,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
});
