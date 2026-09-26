import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Modal, Button, Badge } from '../../../components/common';
import { useTheme } from '../../../theme';
import { useDriverStore } from '../../../stores/driver.store';
import { useAuthStore } from '../../../stores/auth.store';

interface SelectBusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRun: (tripId: string) => Promise<void>;
}

export const SelectBusModal: React.FC<SelectBusModalProps> = ({
  isOpen,
  onClose,
  onStartRun,
}) => {
  const { colors, brandColors, isLight } = useTheme();
  const { user } = useAuthStore();
  const { activeTrip, isActionLoading } = useDriverStore();

  const handleConfirm = async () => {
    if (activeTrip?.id) {
      await onStartRun(activeTrip.id);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Bus & Start Commercial Run"
      subtitle={`Driver: ${user?.fullName || 'Demo Driver'}`}
      icon="🚌"
      actions={
        <>
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            onPress={onClose}
            disabled={isActionLoading}
          />
          <Button
            title="Start Trip Run"
            variant="mint"
            size="md"
            icon="▶"
            isLoading={isActionLoading}
            onPress={handleConfirm}
            disabled={!activeTrip}
          />
        </>
      }
    >
      <View style={styles.body}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          SELECT FLEET VEHICLE FOR TODAY'S RUN
        </Text>

        {activeTrip ? (
          <View
            style={[
              styles.vehicleBox,
              {
                backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.vehicleHeader}>
              <Text style={[styles.vehiclePlate, { color: colors.textPrimary }]}>
                {activeTrip.busRegistrationNumber}
              </Text>
              <Badge variant="success" label="ASSIGNED" />
            </View>
            <Text style={[styles.vehicleSub, { color: colors.textSecondary }]}>
              {activeTrip.busModel} · Route {activeTrip.routeCode}
            </Text>
            <Text style={[styles.routeCorridor, { color: brandColors.primary }]}>
              {activeTrip.origin} ➔ {activeTrip.destination}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.emptyVehicleBox,
              {
                backgroundColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.03)',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: colors.textMuted }}>
              No commercial buses assigned yet
            </Text>
          </View>
        )}

        <View
          style={[
            styles.noticeBox,
            {
              backgroundColor: isLight
                ? 'rgba(0, 212, 136, 0.08)'
                : 'rgba(0, 212, 136, 0.12)',
              borderColor: 'rgba(0, 212, 136, 0.3)',
            },
          ]}
        >
          <Text style={[styles.noticeText, { color: isLight ? '#065f46' : '#34d399' }]}>
            ✓ Starting this trip immediately activates live telemetry, speedometer HUD, and
            transmits radar pings so dispatch and passengers can track your transit bus.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  body: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vehicleBox: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 4,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehiclePlate: {
    fontSize: 18,
    fontWeight: '900',
  },
  vehicleSub: {
    fontSize: 13,
  },
  routeCorridor: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyVehicleBox: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  noticeBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
});
