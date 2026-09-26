import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal, Button, Badge } from '../../../components/common';
import { useTheme } from '../../../theme';
import { useConductorStore } from '../../../stores/conductor.store';

export const ConductorValidationModal: React.FC = () => {
  const { colors, brandColors, isLight } = useTheme();
  const {
    isValidationModalOpen,
    setValidationModalOpen,
    scanStatus,
    scannedTicket,
    scanMessage,
    resetScanState,
  } = useConductorStore();

  const handleClose = () => {
    resetScanState();
    setValidationModalOpen(false);
  };

  const isSuccess = scanStatus === 'VALID';
  const isDuplicate = scanStatus === 'DUPLICATE';
  const isInvalid = scanStatus === 'INVALID';

  const modalTitle = isSuccess
    ? 'Boarding Confirmed'
    : isDuplicate
    ? 'Duplicate Scan Detected'
    : 'Ticket Verification Failed';

  const modalSubtitle = isSuccess
    ? 'Passenger authorized for boarding'
    : isDuplicate
    ? 'Ticket has already been scanned on this trip'
    : 'Authoritative backend rejected ticket payload';

  const modalIcon = isSuccess ? '✅' : isDuplicate ? '⚠️' : '❌';

  return (
    <Modal
      isOpen={isValidationModalOpen}
      onClose={handleClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={modalIcon}
      actions={
        <Button
          title={isSuccess ? 'Scan Next Ticket' : 'Dismiss'}
          variant={isSuccess ? 'primary' : 'outline'}
          size="md"
          onPress={handleClose}
          style={{ width: '100%' }}
        />
      }
    >
      <View style={styles.contentContainer}>
        {/* Status Badge Banner */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: isSuccess
                ? isLight
                  ? '#ecfdf5'
                  : 'rgba(16, 185, 129, 0.15)'
                : isDuplicate
                ? isLight
                  ? '#fffbeb'
                  : 'rgba(245, 158, 11, 0.15)'
                : isLight
                ? '#fef2f2'
                : 'rgba(239, 68, 68, 0.15)',
              borderColor: isSuccess
                ? '#10b981'
                : isDuplicate
                ? '#f59e0b'
                : '#ef4444',
            },
          ]}
        >
          <Text
            style={[
              styles.statusBannerText,
              {
                color: isSuccess
                  ? '#059669'
                  : isDuplicate
                  ? '#d97706'
                  : '#dc2626',
              },
            ]}
          >
            {scanMessage || (isSuccess ? 'VALID TICKET' : 'VERIFICATION ERROR')}
          </Text>
        </View>

        {/* Ticket Details (if ticket payload was returned) */}
        {scannedTicket ? (
          <View
            style={[
              styles.ticketCard,
              {
                backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.seatRow}>
              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  PASSENGER NAME
                </Text>
                <Text style={[styles.passengerName, { color: colors.textPrimary }]}>
                  {scannedTicket.passengerName}
                </Text>
              </View>
              <View
                style={[
                  styles.seatBadge,
                  {
                    backgroundColor: isLight ? '#00D488' : '#00D488',
                  },
                ]}
              >
                <Text style={styles.seatBadgeText}>
                  SEAT #{scannedTicket.seatNumber}
                </Text>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  CORRIDOR ROUTE
                </Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>
                  {scannedTicket.origin} ➔ {scannedTicket.destination}
                </Text>
              </View>

              <View style={styles.detailCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  FARE AMOUNT
                </Text>
                <Text style={[styles.value, { color: brandColors.primary }]}>
                  ₹{scannedTicket.fareAmount}
                </Text>
              </View>

              <View style={styles.detailCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  TICKET ID
                </Text>
                <Text style={[styles.value, { color: colors.textSecondary }]}>
                  {scannedTicket.ticketId?.slice(0, 12)}...
                </Text>
              </View>

              <View style={styles.detailCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  BOARDING TIME
                </Text>
                <Text style={[styles.value, { color: colors.textSecondary }]}>
                  {scannedTicket.boardedAt
                    ? new Date(scannedTicket.boardedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Just now'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorDescription, { color: colors.textSecondary }]}>
              {scanMessage ||
                'The presented ticket was not found or has an invalid digital signature. Please check with passenger or verify manually on manifest.'}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    gap: 14,
    paddingVertical: 4,
  },
  statusBanner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  ticketCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '800',
  },
  seatBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  seatBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailCol: {
    width: '47%',
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
  },
  errorContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  errorDescription: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
