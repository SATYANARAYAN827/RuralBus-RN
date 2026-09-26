import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal, Button, Badge } from '../../../components/common';
import { useTheme } from '../../../theme';
import { useConductorStore } from '../../../stores/conductor.store';

export const ConductorReceiptModal: React.FC = () => {
  const { colors, brandColors, isLight } = useTheme();
  const {
    isReceiptModalOpen,
    setReceiptModalOpen,
    issuedReceipt,
    clearIssuedReceipt,
    activeTrip,
  } = useConductorStore();

  const handleClose = () => {
    clearIssuedReceipt();
    setReceiptModalOpen(false);
  };

  if (!issuedReceipt) return null;

  return (
    <Modal
      isOpen={isReceiptModalOpen}
      onClose={handleClose}
      title="Cash Ticket Issued"
      subtitle="Physical cash collected & synchronized"
      icon="💵"
      actions={
        <Button
          title="Issue Next Cash Ticket"
          variant="primary"
          size="md"
          onPress={handleClose}
          style={{ width: '100%' }}
        />
      }
    >
      <View style={styles.container}>
        {/* Receipt Slip Container */}
        <View
          style={[
            styles.receiptSlip,
            {
              backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)',
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.slipTitle, { color: colors.textPrimary }]}>
                RURALBUS PASSENGER TICKET
              </Text>
              <Text style={[styles.busReg, { color: brandColors.primary }]}>
                {activeTrip?.busRegistrationNumber || 'Fleet Vehicle'}
              </Text>
            </View>
            <Badge
              variant={issuedReceipt.synced ? 'success' : 'neutral'}
              label={issuedReceipt.synced ? 'SYNCED' : 'QUEUED'}
            />
          </View>

          <View style={styles.divider} />

          {/* Stoppage Route */}
          <View style={styles.routeSection}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              CORRIDOR SEGMENT
            </Text>
            <Text style={[styles.routeText, { color: colors.textPrimary }]}>
              {issuedReceipt.fromStopName} ➔ {issuedReceipt.toStopName}
            </Text>
          </View>

          {/* Details Row */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                TICKET CODE
              </Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                {issuedReceipt.ticketCode}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                PASSENGERS
              </Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                {issuedReceipt.passengerCount} {issuedReceipt.passengerCount > 1 ? 'Passengers' : 'Passenger'}
              </Text>
            </View>
          </View>

          {/* Fare Row */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                UNIT FARE
              </Text>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                ₹{issuedReceipt.unitFare}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                TOTAL CASH COLLECTED
              </Text>
              <Text style={[styles.totalAmount, { color: brandColors.primary }]}>
                ₹{issuedReceipt.fareAmount}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Footer note */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Issued: {new Date(issuedReceipt.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Payment: CASH
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
  },
  receiptSlip: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slipTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  busReg: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
    borderStyle: 'dashed',
  },
  routeSection: {
    gap: 2,
  },
  routeText: {
    fontSize: 15,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '900',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
