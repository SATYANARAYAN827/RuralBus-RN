import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Card, Badge, Button, TextInput } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useConductorStore } from '../../stores/conductor.store';
import { ConductorReceiptModal } from './modals/ConductorReceiptModal';

export const ConductorCashTicketsScreen: React.FC = () => {
  const { colors, brandColors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    activeTrip,
    fromStop,
    setFromStop,
    toStop,
    setToStop,
    unitFare,
    setUnitFare,
    passengerCount,
    setPassengerCount,
    totalFare,
    issueCashTicket,
    isIssuingCashTicket,
    cashTicketError,
    offlineQueue,
    isSyncingQueue,
    queueSyncMessage,
    syncOfflineQueue,
  } = useConductorStore();

  const [fareInput, setFareInput] = useState(unitFare.toString());

  const handleUnitFareChange = (text: string) => {
    setFareInput(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setUnitFare(parsed);
    }
  };

  const handleIssueTicket = async () => {
    try {
      await issueCashTicket();
    } catch {
      // Error captured in store
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, isMobile && styles.mobileContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Information */}
      <Card
        padding={14}
        style={[
          styles.headerCard,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Cash Ticketing POS Terminal
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            On-bus physical ticket issuance · Cryptographic offline queue support
          </Text>
        </View>
        <Badge variant="mint" label="POS READY" />
      </Card>

      {/* Error state if cash ticket issuance failed */}
      {cashTicketError && (
        <Card variant="outlined" padding={12} style={{ borderColor: '#ef4444' }}>
          <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>
            {cashTicketError}
          </Text>
        </Card>
      )}

      {/* 2. POS Ticket Configuration Card */}
      <Card
        padding={20}
        style={[
          styles.posCard,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.posHeaderRow}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Issue Cash Ticket
          </Text>
          <Badge
            variant="neutral"
            label={activeTrip?.busRegistrationNumber || 'Commercial Bus'}
          />
        </View>

        {/* Origin & Destination Inputs */}
        <View style={styles.stopsGrid}>
          <TextInput
            label="BOARDING STOP (FROM)"
            placeholder="e.g. Origin Stop"
            value={fromStop || activeTrip?.origin || ''}
            onChangeText={setFromStop}
            leftIcon="📍"
          />

          <TextInput
            label="DESTINATION STOP (TO)"
            placeholder="e.g. Destination Stop"
            value={toStop || activeTrip?.destination || ''}
            onChangeText={setToStop}
            leftIcon="🏁"
          />
        </View>

        {/* Quick Stop Pills if trip has sequenced stops */}
        {activeTrip?.stops && activeTrip.stops.length > 0 && (
          <View style={styles.quickStopsSection}>
            <Text style={[styles.quickStopsTitle, { color: colors.textSecondary }]}>
              Quick Corridor Stop Selectors:
            </Text>
            <View style={styles.stopPillsRow}>
              {activeTrip.stops.slice(0, 5).map((s) => (
                <TouchableOpacity
                  key={s.stopId}
                  style={[
                    styles.stopPill,
                    {
                      backgroundColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setToStop(s.stopName)}
                >
                  <Text style={[styles.stopPillText, { color: colors.textPrimary }]}>
                    {s.stopName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Passenger Quantity & Unit Fare */}
        <View style={styles.fareConfigRow}>
          {/* Passenger Count Stepper */}
          <View style={styles.stepperContainer}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              PASSENGERS
            </Text>
            <View
              style={[
                styles.stepper,
                {
                  backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.06)',
                  borderColor: colors.border,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                disabled={passengerCount <= 1}
              >
                <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>−</Text>
              </TouchableOpacity>

              <Text style={[styles.stepCountText, { color: colors.textPrimary }]}>
                {passengerCount}
              </Text>

              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setPassengerCount(Math.min(10, passengerCount + 1))}
                disabled={passengerCount >= 10}
              >
                <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Unit Fare Input */}
          <View style={styles.fareContainer}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              UNIT FARE (₹)
            </Text>
            <TextInput
              placeholder="50"
              value={fareInput}
              onChangeText={handleUnitFareChange}
              keyboardType="numeric"
              leftIcon="₹"
            />
          </View>
        </View>

        {/* Total Calculation Display */}
        <View
          style={[
            styles.totalCalculationCard,
            {
              backgroundColor: isLight ? '#f0fdf4' : 'rgba(0, 212, 136, 0.08)',
              borderColor: brandColors.primary,
            },
          ]}
        >
          <View>
            <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>
              TOTAL CASH AMOUNT DUE
            </Text>
            <Text style={[styles.calcBreakdown, { color: colors.textSecondary }]}>
              ₹{unitFare} × {passengerCount} {passengerCount > 1 ? 'Passengers' : 'Passenger'}
            </Text>
          </View>
          <Text style={[styles.calcTotal, { color: brandColors.primary }]}>
            ₹{totalFare}
          </Text>
        </View>

        {/* Issue Ticket Action CTA */}
        <Button
          title={isIssuingCashTicket ? 'Issuing Cash Ticket...' : `Collect ₹${totalFare} & Issue Ticket`}
          variant="primary"
          size="lg"
          icon="💵"
          onPress={handleIssueTicket}
          isLoading={isIssuingCashTicket}
          style={{ marginTop: 8 }}
        />
      </Card>

      {/* 3. Safe Offline Queue Panel */}
      <Card
        padding={16}
        style={[
          styles.offlineCard,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.offlineHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 18 }}>📶</Text>
            <View>
              <Text style={[styles.offlineTitle, { color: colors.textPrimary }]}>
                Offline Ticket Synchronization
              </Text>
              <Text style={[styles.offlineSub, { color: colors.textSecondary }]}>
                {offlineQueue.length > 0
                  ? `${offlineQueue.length} tickets pending server sync`
                  : 'All offline cash tickets are synchronized with server'}
              </Text>
            </View>
          </View>

          {offlineQueue.length > 0 && (
            <Button
              title="Sync Batch"
              variant="outline"
              size="sm"
              onPress={() => syncOfflineQueue()}
              isLoading={isSyncingQueue}
            />
          )}
        </View>

        {queueSyncMessage && (
          <Text style={[styles.syncStatusMsg, { color: brandColors.primary }]}>
            {queueSyncMessage}
          </Text>
        )}
      </Card>

      {/* Issued Ticket Receipt Slip Modal */}
      <ConductorReceiptModal />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  mobileContainer: {
    paddingHorizontal: 4,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    flexWrap: 'wrap',
    gap: 10,
  },
  headerLeft: {
    flex: 1,
    minWidth: 240,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  posCard: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  posHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  stopsGrid: {
    gap: 10,
  },
  quickStopsSection: {
    gap: 6,
  },
  quickStopsTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  stopPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stopPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  stopPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  fareConfigRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepperContainer: {
    flex: 1,
    gap: 4,
  },
  fareContainer: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  stepBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 20,
    fontWeight: '800',
  },
  stepCountText: {
    fontSize: 18,
    fontWeight: '900',
  },
  totalCalculationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  calcLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  calcBreakdown: {
    fontSize: 12,
    marginTop: 2,
  },
  calcTotal: {
    fontSize: 24,
    fontWeight: '900',
  },
  offlineCard: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  offlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  offlineTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  offlineSub: {
    fontSize: 11,
    marginTop: 2,
  },
  syncStatusMsg: {
    fontSize: 12,
    fontWeight: '700',
  },
});
