import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { Modal, Button, TextInput } from '../../components/common';
import { usePassengerStore } from '../../stores/passenger.store';

interface SeatSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToBooking: () => void;
}

export const SeatSelectionModal: React.FC<SeatSelectionModalProps> = ({
  isOpen,
  onClose,
  onProceedToBooking,
}) => {
  const { colors, isLight } = useTheme();
  const {
    selectedTrip,
    seats,
    selectedSeats,
    toggleSeat,
    passengerName,
    passengerPhone,
    setPassengerInfo,
  } = usePassengerStore();

  if (!selectedTrip) return null;

  const totalFare = selectedSeats.length * selectedTrip.fare;

  // Group seats by row
  const rows: Record<number, typeof seats> = {};
  seats.forEach((seat) => {
    if (!rows[seat.row]) rows[seat.row] = [];
    rows[seat.row].push(seat);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Your Seats"
      subtitle={`${selectedTrip.busModel} · Fare: ₹${selectedTrip.fare}/seat`}
      icon="🪑"
      maxWidth={520}
    >
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Seat Legend */}
        <View
          style={[
            styles.legendContainer,
            {
              backgroundColor: isLight ? '#f8fafc' : '#1e293b',
              borderColor: isLight ? '#e2e8f0' : '#334155',
            },
          ]}
        >
          <View style={styles.legendItem}>
            <View style={[styles.seatBoxMini, { backgroundColor: isLight ? '#ffffff' : '#334155', borderColor: '#cbd5e1' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.seatBoxMini, { backgroundColor: '#00D488', borderColor: '#047857' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.seatBoxMini, { backgroundColor: '#cbd5e1', borderColor: '#94a3b8' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Booked</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.seatBoxMini, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Held</Text>
          </View>
        </View>

        {/* Bus Cabin Visual Layout */}
        <View
          style={[
            styles.busCabin,
            {
              backgroundColor: isLight ? '#ffffff' : '#0f172a',
              borderColor: isLight ? '#cbd5e1' : '#334155',
            },
          ]}
        >
          {/* Driver Cabin Front */}
          <View
            style={[
              styles.driverRow,
              {
                backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
                borderBottomColor: isLight ? '#e2e8f0' : '#334155',
              },
            ]}
          >
            <Text style={[styles.frontLabel, { color: colors.textMuted }]}>
              FRONT / WINDSHIELD
            </Text>
            <View style={styles.steeringWheel}>
              <Text style={{ fontSize: 16 }}>☸️ Driver</Text>
            </View>
          </View>

          {/* Seat Rows Grid */}
          <View style={styles.seatRowsContainer}>
            {Object.keys(rows).map((rowStr) => {
              const rowNum = parseInt(rowStr, 10);
              const rowSeats = rows[rowNum];
              const leftSeats = rowSeats.filter((s) => s.col <= 2);
              const rightSeats = rowSeats.filter((s) => s.col > 2);

              return (
                <View key={rowNum} style={styles.seatRow}>
                  {/* Left Column (A, B) */}
                  <View style={styles.seatPair}>
                    {leftSeats.map((seat) => {
                      const isSelected = selectedSeats.includes(seat.label);
                      const isBooked = seat.status === 'BOOKED';
                      const isHeld = seat.status === 'HELD';

                      return (
                        <TouchableOpacity
                          key={seat.id}
                          disabled={isBooked || isHeld}
                          onPress={() => toggleSeat(seat.label)}
                          style={[
                            styles.seatBox,
                            {
                              backgroundColor: isSelected
                                ? '#00D488'
                                : isBooked
                                ? '#e2e8f0'
                                : isHeld
                                ? '#fef3c7'
                                : (isLight ? '#ffffff' : '#1e293b'),
                              borderColor: isSelected
                                ? '#047857'
                                : isBooked
                                ? '#cbd5e1'
                                : isHeld
                                ? '#f59e0b'
                                : (isLight ? '#cbd5e1' : '#475569'),
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.seatLabel,
                              {
                                color: isSelected
                                  ? '#ffffff'
                                  : isBooked
                                  ? '#94a3b8'
                                  : isHeld
                                  ? '#b45309'
                                  : colors.textPrimary,
                              },
                            ]}
                          >
                            {seat.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Center Aisle */}
                  <View style={styles.aisle}>
                    <Text style={[styles.aisleText, { color: colors.textMuted }]}>
                      {rowNum}
                    </Text>
                  </View>

                  {/* Right Column (C, D) */}
                  <View style={styles.seatPair}>
                    {rightSeats.map((seat) => {
                      const isSelected = selectedSeats.includes(seat.label);
                      const isBooked = seat.status === 'BOOKED';
                      const isHeld = seat.status === 'HELD';

                      return (
                        <TouchableOpacity
                          key={seat.id}
                          disabled={isBooked || isHeld}
                          onPress={() => toggleSeat(seat.label)}
                          style={[
                            styles.seatBox,
                            {
                              backgroundColor: isSelected
                                ? '#00D488'
                                : isBooked
                                ? '#e2e8f0'
                                : isHeld
                                ? '#fef3c7'
                                : (isLight ? '#ffffff' : '#1e293b'),
                              borderColor: isSelected
                                ? '#047857'
                                : isBooked
                                ? '#cbd5e1'
                                : isHeld
                                ? '#f59e0b'
                                : (isLight ? '#cbd5e1' : '#475569'),
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.seatLabel,
                              {
                                color: isSelected
                                  ? '#ffffff'
                                  : isBooked
                                  ? '#94a3b8'
                                  : isHeld
                                  ? '#b45309'
                                  : colors.textPrimary,
                              },
                            ]}
                          >
                            {seat.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Passenger Information */}
        <View style={styles.passengerForm}>
          <Text style={[styles.formTitle, { color: colors.textSecondary }]}>
            PRIMARY COMMUTER CONTACT
          </Text>

          <TextInput
            label="FULL NAME"
            placeholder="e.g. Ramesh Chandra Das"
            value={passengerName}
            onChangeText={(text) => setPassengerInfo(text, passengerPhone)}
            leftIcon="👤"
          />

          <TextInput
            label="MOBILE NUMBER"
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            value={passengerPhone}
            onChangeText={(text) => setPassengerInfo(passengerName, text)}
            leftIcon="📱"
          />
        </View>

        {/* Selection Summary Footer */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.08)',
              borderColor: '#a7f3d0',
            },
          ]}
        >
          <View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              {selectedSeats.length > 0
                ? `Seats: ${selectedSeats.join(', ')}`
                : 'No seats selected'}
            </Text>
            <Text style={[styles.summarySub, { color: colors.textMuted }]}>
              {selectedSeats.length} Seat(s) selected
            </Text>
          </View>
          <Text style={styles.summaryTotal}>₹{totalFare}</Text>
        </View>

        <Button
          title={selectedSeats.length > 0 ? `Hold ${selectedSeats.length} Seat(s) & Proceed ➔` : 'Select at least 1 Seat'}
          variant="primary"
          size="lg"
          disabled={selectedSeats.length === 0}
          onPress={() => {
            onClose();
            onProceedToBooking();
          }}
        />
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    maxHeight: 520,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seatBoxMini: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  busCabin: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 12,
    marginBottom: 16,
  },
  driverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderBottomWidth: 1.5,
    marginBottom: 12,
  },
  frontLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  steeringWheel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatRowsContainer: {
    gap: 8,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seatPair: {
    flexDirection: 'row',
    gap: 8,
  },
  aisle: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aisleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  seatBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  passengerForm: {
    marginBottom: 14,
    gap: 8,
  },
  formTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  summarySub: {
    fontSize: 11,
    marginTop: 2,
  },
  summaryTotal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#00D488',
  },
});
