import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal, Button } from '../../../components/common';
import { useTheme } from '../../../theme';
import { useDriverStore } from '../../../stores/driver.store';

interface EndTripConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmEnd: (tripId: string) => Promise<void>;
}

export const EndTripConfirmModal: React.FC<EndTripConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmEnd,
}) => {
  const { colors, isLight } = useTheme();
  const { activeTrip, isActionLoading } = useDriverStore();

  const handleConfirm = async () => {
    if (activeTrip?.id) {
      await onConfirmEnd(activeTrip.id);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="End Commercial Trip Run?"
      subtitle="Complete Highway Duty Run"
      icon="⚠️"
      actions={
        <>
          <Button
            title="Cancel & Resume Duty"
            variant="outline"
            size="md"
            onPress={onClose}
            disabled={isActionLoading}
          />
          <Button
            title="Confirm & End Trip"
            variant="danger"
            size="md"
            icon="■"
            isLoading={isActionLoading}
            onPress={handleConfirm}
          />
        </>
      }
    >
      <View style={styles.body}>
        <Text style={[styles.message, { color: colors.textPrimary }]}>
          Are you sure you want to end this trip for vehicle{' '}
          <Text style={{ fontWeight: '800' }}>
            {activeTrip?.busRegistrationNumber || 'Assigned Bus'}
          </Text>
          ?
        </Text>

        <View
          style={[
            styles.warningBox,
            {
              backgroundColor: isLight
                ? 'rgba(239, 68, 68, 0.08)'
                : 'rgba(239, 68, 68, 0.15)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            },
          ]}
        >
          <Text style={[styles.warningText, { color: isLight ? '#991b1b' : '#f87171' }]}>
            Ending this trip will mark it COMPLETED on the state transport grid, stop active GPS
            telemetry pings, and archive the route logs to your trip history.
          </Text>
        </View>

        {activeTrip && (
          <View
            style={[
              styles.summaryBox,
              {
                backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              CORRIDOR SUMMARY
            </Text>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
              {activeTrip.origin} ➔ {activeTrip.destination}
            </Text>
            <Text style={[styles.summarySub, { color: colors.textMuted }]}>
              Route {activeTrip.routeCode} · Distance: {activeTrip.totalDistanceKm} km
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  body: {
    gap: 12,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  warningBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  summaryBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  summarySub: {
    fontSize: 12,
  },
});
