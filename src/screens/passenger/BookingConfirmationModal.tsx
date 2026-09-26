import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { Modal, Button, Badge } from '../../components/common';
import { PaymentMethod } from '../../types';
import { usePassengerStore } from '../../stores/passenger.store';

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: () => void;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  isOpen,
  onClose,
  onBookingSuccess,
}) => {
  const { colors, isLight } = useTheme();
  const {
    selectedTrip,
    selectedSeats,
    passengerName,
    passengerPhone,
    isBookingProcessing,
    bookingError,
    confirmBooking,
  } = usePassengerStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');

  if (!selectedTrip) return null;

  const totalFare = selectedSeats.length * selectedTrip.fare;

  const handlePay = async () => {
    const ticket = await confirmBooking(paymentMethod);
    if (ticket) {
      onBookingSuccess();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Booking Confirmation & Payment"
      subtitle="Verify journey details & select payment"
      icon="💳"
      maxWidth={520}
    >
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Error alert if any */}
        {bookingError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {bookingError}</Text>
          </View>
        )}

        {/* Journey Summary Card */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: isLight ? '#f8fafc' : '#1e293b',
              borderColor: isLight ? '#e2e8f0' : '#334155',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.busTitle, { color: colors.textPrimary }]}>
                {selectedTrip.routeName}
              </Text>
              <Text style={[styles.operatorText, { color: colors.textSecondary }]}>
                {selectedTrip.operatorName} · {selectedTrip.busRegistration}
              </Text>
            </View>
            <Badge variant="mint" label={selectedTrip.busType} />
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Departure Time:
            </Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {selectedTrip.departureTime} (Est. Arrival {selectedTrip.arrivalTime})
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Reserved Seats:
            </Text>
            <Text style={[styles.detailValue, { color: '#047857', fontWeight: '800' }]}>
              {selectedSeats.join(', ')} ({selectedSeats.length} Seats)
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Primary Commuter:
            </Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {passengerName} ({passengerPhone})
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            SELECT PAYMENT METHOD
          </Text>

          <View style={styles.methodList}>
            {/* UPI Option */}
            <TouchableOpacity
              onPress={() => setPaymentMethod('UPI')}
              style={[
                styles.methodItem,
                {
                  backgroundColor: paymentMethod === 'UPI' ? '#ecfdf5' : (isLight ? '#ffffff' : '#1e293b'),
                  borderColor: paymentMethod === 'UPI' ? '#00D488' : (isLight ? '#cbd5e1' : '#334155'),
                },
              ]}
            >
              <View style={styles.methodIconBox}>
                <Text style={{ fontSize: 20 }}>📱</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodTitle, { color: paymentMethod === 'UPI' ? '#047857' : colors.textPrimary }]}>
                  Instant UPI
                </Text>
                <Text style={[styles.methodDesc, { color: colors.textSecondary }]}>
                  Google Pay, PhonePe, Paytm, BHIM UPI
                </Text>
              </View>
              {paymentMethod === 'UPI' && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>

            {/* Wallet Option */}
            <TouchableOpacity
              onPress={() => setPaymentMethod('WALLET')}
              style={[
                styles.methodItem,
                {
                  backgroundColor: paymentMethod === 'WALLET' ? '#ecfdf5' : (isLight ? '#ffffff' : '#1e293b'),
                  borderColor: paymentMethod === 'WALLET' ? '#00D488' : (isLight ? '#cbd5e1' : '#334155'),
                },
              ]}
            >
              <View style={styles.methodIconBox}>
                <Text style={{ fontSize: 20 }}>💳</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodTitle, { color: paymentMethod === 'WALLET' ? '#047857' : colors.textPrimary }]}>
                  RuralBus Smart Wallet
                </Text>
                <Text style={[styles.methodDesc, { color: colors.textSecondary }]}>
                  Balance: ₹500 (Preloaded commuter card)
                </Text>
              </View>
              {paymentMethod === 'WALLET' && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>

            {/* Cash to Conductor */}
            <TouchableOpacity
              onPress={() => setPaymentMethod('CASH')}
              style={[
                styles.methodItem,
                {
                  backgroundColor: paymentMethod === 'CASH' ? '#ecfdf5' : (isLight ? '#ffffff' : '#1e293b'),
                  borderColor: paymentMethod === 'CASH' ? '#00D488' : (isLight ? '#cbd5e1' : '#334155'),
                },
              ]}
            >
              <View style={styles.methodIconBox}>
                <Text style={{ fontSize: 20 }}>💵</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodTitle, { color: paymentMethod === 'CASH' ? '#047857' : colors.textPrimary }]}>
                  Pay Cash to Conductor
                </Text>
                <Text style={[styles.methodDesc, { color: colors.textSecondary }]}>
                  Pay physical currency on boarding with PNR verification
                </Text>
              </View>
              {paymentMethod === 'CASH' && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Fare Total Box */}
        <View
          style={[
            styles.totalCard,
            {
              backgroundColor: isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.08)',
              borderColor: '#a7f3d0',
            },
          ]}
        >
          <View>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
              NET PAYABLE AMOUNT
            </Text>
            <Text style={[styles.totalSub, { color: colors.textMuted }]}>
              Includes all road cess & state passenger taxes
            </Text>
          </View>
          <Text style={styles.totalAmount}>₹{totalFare}</Text>
        </View>

        {/* Action Button */}
        <Button
          title={isBookingProcessing ? 'Authorizing Payment...' : `Pay ₹${totalFare} & Generate Boarding QR ➔`}
          variant="primary"
          size="lg"
          isLoading={isBookingProcessing}
          onPress={handlePay}
        />
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    maxHeight: 520,
  },
  errorBox: {
    padding: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginBottom: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  busTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  operatorText: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  paymentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  methodList: {
    gap: 8,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  methodIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  methodDesc: {
    fontSize: 11,
  },
  check: {
    fontSize: 16,
    fontWeight: '900',
    color: '#00D488',
    marginLeft: 8,
  },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  totalSub: {
    fontSize: 11,
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#00D488',
  },
});
