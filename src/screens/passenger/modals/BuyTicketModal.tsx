import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../theme';
import { Modal, Button } from '../../../components/common';
import { PaymentMethod } from '../../../types';
import { FALLBACK_STOPS, FALLBACK_BUSES } from '../../../services/passenger.service';
import { usePassengerStore } from '../../../stores/passenger.store';

interface BuyTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketGenerated?: () => void;
}

export const BuyTicketModal: React.FC<BuyTicketModalProps> = ({
  isOpen,
  onClose,
  onTicketGenerated,
}) => {
  const { colors, isLight } = useTheme();
  const { confirmBooking, selectTrip, toggleSeat } = usePassengerStore();

  const [fromStop, setFromStop] = useState(FALLBACK_STOPS[0].name);
  const [toStop, setToStop] = useState(FALLBACK_STOPS[7].name);
  const [passengerCount, setPassengerCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unitFare = 44;
  const totalAmount = unitFare * passengerCount;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      // Configure default trip for quick ticket issuance
      const defaultTrip = FALLBACK_BUSES[0];
      selectTrip(defaultTrip);
      for (let i = 1; i <= passengerCount; i++) {
        toggleSeat(`${i}A`);
      }
      await confirmBooking(paymentMethod);
      setIsSubmitting(false);
      onClose();
      if (onTicketGenerated) onTicketGenerated();
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Buy Mobile E-Ticket"
      subtitle="Instant QR Boarding Pass"
      icon="🎟️"
      maxWidth={460}
    >
      <View style={styles.formContainer}>
        {/* Boarding Stop */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            BOARDING STOP
          </Text>
          <View
            style={[
              styles.dropdownBox,
              {
                backgroundColor: isLight ? '#f8fafc' : '#1e293b',
                borderColor: isLight ? '#cbd5e1' : '#334155',
              },
            ]}
          >
            <Text style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '600' }}>
              📍 {fromStop} (0 km)
            </Text>
          </View>
        </View>

        {/* Destination Stop */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            DESTINATION STOP
          </Text>
          <View
            style={[
              styles.dropdownBox,
              {
                backgroundColor: isLight ? '#f8fafc' : '#1e293b',
                borderColor: isLight ? '#cbd5e1' : '#334155',
              },
            ]}
          >
            <Text style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '600' }}>
              🎯 {toStop} (65 km)
            </Text>
          </View>
        </View>

        {/* Number of Passengers Stepper */}
        <View style={styles.stepperRow}>
          <Text style={[styles.stepperLabel, { color: colors.textPrimary }]}>
            Number of Passengers
          </Text>
          <View style={styles.stepperControls}>
            <TouchableOpacity
              onPress={() => setPassengerCount(Math.max(1, passengerCount - 1))}
              style={[
                styles.stepBtn,
                { borderColor: isLight ? '#cbd5e1' : '#475569' },
              ]}
            >
              <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.stepCount, { color: colors.textPrimary }]}>
              {passengerCount}
            </Text>
            <TouchableOpacity
              onPress={() => setPassengerCount(Math.min(6, passengerCount + 1))}
              style={[
                styles.stepBtn,
                { borderColor: isLight ? '#cbd5e1' : '#475569' },
              ]}
            >
              <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            PAYMENT METHOD
          </Text>
          <View style={styles.paymentMethodsRow}>
            {(['UPI', 'WALLET', 'CARD', 'CASH'] as PaymentMethod[]).map((method) => {
              const isSelected = paymentMethod === method;
              return (
                <TouchableOpacity
                  key={method}
                  onPress={() => setPaymentMethod(method)}
                  style={[
                    styles.methodPill,
                    {
                      backgroundColor: isSelected ? '#ecfdf5' : (isLight ? '#f8fafc' : '#1e293b'),
                      borderColor: isSelected ? '#00D488' : (isLight ? '#cbd5e1' : '#334155'),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.methodPillText,
                      { color: isSelected ? '#047857' : colors.textSecondary },
                    ]}
                  >
                    {method === 'UPI' ? '📱 UPI' : method === 'WALLET' ? '💳 Wallet' : method === 'CARD' ? '🏦 Card' : '💵 Cash'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Total Amount Box */}
        <View
          style={[
            styles.totalBox,
            {
              backgroundColor: isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.08)',
              borderColor: '#a7f3d0',
            },
          ]}
        >
          <View>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
              TOTAL AMOUNT
            </Text>
            <Text style={[styles.totalSub, { color: colors.textMuted }]}>
              {passengerCount} Ticket(s) · 65 km
            </Text>
          </View>
          <Text style={styles.totalPrice}>₹{totalAmount}</Text>
        </View>

        {/* CTA */}
        <Button
          title="Confirm & Generate QR Boarding Pass ➔"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          onPress={handleConfirm}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dropdownBox: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  stepCount: {
    fontSize: 16,
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  totalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  totalPrice: {
    fontSize: 26,
    fontWeight: '900',
    color: '#00D488',
  },
});
