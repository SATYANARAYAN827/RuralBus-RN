import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { Modal, Button, Badge } from '../../components/common';
import { usePassengerStore } from '../../stores/passenger.store';

interface TripDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToSeats: () => void;
}

export const TripDetailsModal: React.FC<TripDetailsModalProps> = ({
  isOpen,
  onClose,
  onProceedToSeats,
}) => {
  const { colors, isLight } = useTheme();
  const { selectedTrip } = usePassengerStore();

  if (!selectedTrip) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedTrip.routeName}
      subtitle={`${selectedTrip.routeCode} · ${selectedTrip.operatorName}`}
      icon="🚌"
      maxWidth={520}
    >
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Bus Overview Header */}
        <View
          style={[
            styles.overviewCard,
            {
              backgroundColor: isLight ? '#f8fafc' : '#1e293b',
              borderColor: isLight ? '#e2e8f0' : '#334155',
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.busModel, { color: colors.textPrimary }]}>
                {selectedTrip.busModel}
              </Text>
              <Text style={[styles.regNumber, { color: colors.textSecondary }]}>
                Registration: {selectedTrip.busRegistration}
              </Text>
            </View>
            <Badge variant="mint" label={selectedTrip.busType} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#047857' }]}>
                {selectedTrip.departureTime}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Departure
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {selectedTrip.duration}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Duration
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {selectedTrip.arrivalTime}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Arrival
              </Text>
            </View>
          </View>
        </View>

        {/* Stoppages Timeline */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ROUTE STOPPAGES & SCHEDULE
          </Text>

          <View style={styles.timeline}>
            {selectedTrip.stops.map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === selectedTrip.stops.length - 1;
              return (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineIndicator}>
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: isFirst || isLast ? '#00D488' : '#cbd5e1',
                          borderColor: isFirst || isLast ? '#047857' : '#94a3b8',
                        },
                      ]}
                    />
                    {!isLast && <View style={[styles.line, { backgroundColor: isLight ? '#e2e8f0' : '#334155' }]} />}
                  </View>
                  <View style={styles.stopDetails}>
                    <Text style={[styles.timelineStopName, { color: colors.textPrimary }]}>
                      {stop.stopName}
                    </Text>
                    <Text style={[styles.timelineTime, { color: colors.textMuted }]}>
                      {stop.arrivalTime} · {stop.distanceKm} km
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ONBOARD AMENITIES
          </Text>
          <View style={styles.amenitiesGrid}>
            {selectedTrip.amenities.map((amenity, idx) => (
              <View
                key={idx}
                style={[
                  styles.amenityChip,
                  {
                    backgroundColor: isLight ? '#ffffff' : '#1e293b',
                    borderColor: isLight ? '#e2e8f0' : '#334155',
                  },
                ]}
              >
                <Text style={{ fontSize: 13, marginRight: 6 }}>✓</Text>
                <Text style={[styles.amenityText, { color: colors.textPrimary }]}>
                  {amenity}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Fare & Seats Summary */}
        <View
          style={[
            styles.fareBox,
            {
              backgroundColor: isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.08)',
              borderColor: '#a7f3d0',
            },
          ]}
        >
          <View>
            <Text style={[styles.fareLabel, { color: colors.textSecondary }]}>
              BASE FARE PER SEAT
            </Text>
            <Text style={[styles.seatsAvailable, { color: '#047857' }]}>
              {selectedTrip.availableSeats} Seats Available
            </Text>
          </View>
          <Text style={styles.fareAmount}>₹{selectedTrip.fare}</Text>
        </View>

        {/* Action CTA */}
        <Button
          title="Select Seats & Reserve ➔"
          variant="primary"
          size="lg"
          onPress={() => {
            onClose();
            onProceedToSeats();
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
  overviewCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  busModel: {
    fontSize: 16,
    fontWeight: '800',
  },
  regNumber: {
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  timeline: {
    paddingLeft: 6,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 40,
  },
  timelineIndicator: {
    width: 20,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    marginTop: 4,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 2,
    marginBottom: 2,
  },
  stopDetails: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 10,
  },
  timelineStopName: {
    fontSize: 13,
    fontWeight: '700',
  },
  timelineTime: {
    fontSize: 11,
    marginTop: 2,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  amenityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  fareBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  fareLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  seatsAvailable: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#00D488',
  },
});
