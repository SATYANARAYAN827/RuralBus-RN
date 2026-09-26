import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Card, Badge, TextInput, LoadingIndicator } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useConductorStore } from '../../stores/conductor.store';
import { ManifestPassenger } from '../../types';

export const ConductorPassengersScreen: React.FC = () => {
  const { colors, brandColors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    activeTrip,
    manifest,
    isLoadingManifest,
    manifestError,
    manifestSearch,
    setManifestSearch,
    manifestFilter,
    setManifestFilter,
    fetchManifest,
    toggleBoarding,
    totalBookedSeats,
    totalBoardedSeats,
    totalAwaitingSeats,
  } = useConductorStore();

  const [togglingTicketId, setTogglingTicketId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTrip?.id) {
      fetchManifest(activeTrip.id);
    }
  }, [activeTrip?.id, fetchManifest]);

  const handleToggleBoarding = async (passenger: ManifestPassenger) => {
    setTogglingTicketId(passenger.ticketId);
    setActionError(null);
    try {
      await toggleBoarding(passenger.ticketId);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update boarding status on server');
    } finally {
      setTogglingTicketId(null);
    }
  };

  // Filter passengers based on search and selected filter tab
  const filteredPassengers = manifest.filter((p) => {
    // 1. Tab filter
    if (manifestFilter === 'BOARDED' && !p.isBoarded) return false;
    if (manifestFilter === 'WAITING' && p.isBoarded) return false;

    // 2. Search query filter
    if (manifestSearch.trim()) {
      const q = manifestSearch.toLowerCase();
      const matchName = p.passengerName?.toLowerCase().includes(q);
      const matchSeat = p.seatNumber?.toString().includes(q);
      const matchTicket = p.ticketNumber?.toLowerCase().includes(q);
      const matchStop =
        p.fromStopName?.toLowerCase().includes(q) ||
        p.toStopName?.toLowerCase().includes(q);
      return matchName || matchSeat || matchTicket || matchStop;
    }

    return true;
  });

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, isMobile && styles.mobileContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Information & Seating Stats */}
      <Card
        padding={16}
        style={[
          styles.headerCard,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Passenger Manifest & Roster
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {activeTrip?.routeCode || 'Route'} · {activeTrip?.busRegistrationNumber || 'Commercial Bus'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => fetchManifest()}
            style={[
              styles.refreshButton,
              {
                backgroundColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.refreshText, { color: colors.textPrimary }]}>
              ↻ Refresh
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3 Count Badges */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricChip, { backgroundColor: 'rgba(0, 212, 136, 0.1)' }]}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>BOOKED</Text>
            <Text style={[styles.metricValue, { color: brandColors.primary }]}>
              {totalBookedSeats}
            </Text>
          </View>

          <View style={[styles.metricChip, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>BOARDED</Text>
            <Text style={[styles.metricValue, { color: '#10b981' }]}>
              {totalBoardedSeats}
            </Text>
          </View>

          <View style={[styles.metricChip, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>AWAITING</Text>
            <Text style={[styles.metricValue, { color: '#f59e0b' }]}>
              {totalAwaitingSeats}
            </Text>
          </View>
        </View>
      </Card>

      {/* Action Error Notification */}
      {actionError && (
        <Card variant="outlined" padding={12} style={{ borderColor: '#ef4444' }}>
          <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>
            {actionError}
          </Text>
        </Card>
      )}

      {/* 2. Search & Segmented Filter Tabs */}
      <View style={styles.filterSection}>
        <TextInput
          placeholder="Search by passenger, seat # or ticket ID..."
          value={manifestSearch}
          onChangeText={setManifestSearch}
          leftIcon="🔍"
          style={{ marginBottom: 8 }}
        />

        <View style={styles.tabPillsRow}>
          {(['ALL', 'WAITING', 'BOARDED'] as const).map((tab) => {
            const isSelected = manifestFilter === tab;
            const count =
              tab === 'ALL'
                ? manifest.length
                : tab === 'BOARDED'
                ? totalBoardedSeats
                : totalAwaitingSeats;

            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setManifestFilter(tab)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: isSelected
                      ? brandColors.primary
                      : isLight
                      ? '#ffffff'
                      : 'rgba(255, 255, 255, 0.08)',
                    borderColor: isSelected ? brandColors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    { color: isSelected ? '#000000' : colors.textPrimary },
                  ]}
                >
                  {tab === 'ALL' ? 'All Passengers' : tab === 'WAITING' ? 'Awaiting Boarding' : 'Boarded'} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Passenger List */}
      {isLoadingManifest ? (
        <Card padding={28} style={{ alignItems: 'center' }}>
          <LoadingIndicator message="Loading real-time passenger manifest..." />
        </Card>
      ) : manifestError ? (
        <Card variant="outlined" padding={20} style={{ borderColor: '#ef4444', alignItems: 'center' }}>
          <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 14 }}>
            {manifestError}
          </Text>
          <TouchableOpacity onPress={() => fetchManifest()} style={{ marginTop: 10 }}>
            <Text style={{ color: brandColors.primary, fontWeight: '800' }}>
              Retry Loading Manifest
            </Text>
          </TouchableOpacity>
        </Card>
      ) : filteredPassengers.length === 0 ? (
        <Card padding={28} style={{ alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 28 }}>👥</Text>
          <Text style={[styles.emptyListTitle, { color: colors.textPrimary }]}>
            No Passengers Found
          </Text>
          <Text style={[styles.emptyListSub, { color: colors.textSecondary }]}>
            {manifestSearch
              ? `No passenger records matching "${manifestSearch}"`
              : 'No booked passengers on manifest for this category.'}
          </Text>
        </Card>
      ) : (
        <View style={styles.passengerList}>
          {filteredPassengers.map((passenger) => {
            const isToggling = togglingTicketId === passenger.ticketId;

            return (
              <Card
                key={passenger.ticketId}
                padding={14}
                style={[
                  styles.passengerCard,
                  {
                    backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                    borderColor: passenger.isBoarded
                      ? isLight
                        ? '#86efac'
                        : 'rgba(34, 197, 94, 0.3)'
                      : colors.border,
                  },
                ]}
              >
                <View style={styles.cardMain}>
                  {/* Seat Badge */}
                  <View
                    style={[
                      styles.seatBadge,
                      {
                        backgroundColor: passenger.isBoarded
                          ? '#10b981'
                          : isLight
                          ? '#e2e8f0'
                          : 'rgba(255, 255, 255, 0.1)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.seatNumText,
                        { color: passenger.isBoarded ? '#ffffff' : colors.textPrimary },
                      ]}
                    >
                      #{passenger.seatNumber}
                    </Text>
                  </View>

                  {/* Passenger Info */}
                  <View style={styles.passengerInfo}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.passengerName, { color: colors.textPrimary }]}>
                        {passenger.passengerName}
                      </Text>
                      <Badge
                        variant={passenger.isBoarded ? 'success' : 'warning'}
                        label={passenger.isBoarded ? 'BOARDED' : 'WAITING'}
                      />
                    </View>

                    <Text style={[styles.routeStops, { color: colors.textSecondary }]}>
                      {passenger.fromStopName} ➔ {passenger.toStopName}
                    </Text>

                    <View style={styles.cardFooterRow}>
                      <Text style={[styles.ticketIdText, { color: colors.textMuted }]}>
                        Tkt: {passenger.ticketNumber} · Fare: ₹{passenger.fare}
                      </Text>
                      {passenger.passengerPhone && (
                        <Text style={[styles.phoneText, { color: colors.textSecondary }]}>
                          📞 {passenger.passengerPhone}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Boarding Action Toggle */}
                <TouchableOpacity
                  style={[
                    styles.boardActionButton,
                    {
                      backgroundColor: passenger.isBoarded
                        ? isLight
                          ? '#fee2e2'
                          : 'rgba(239, 68, 68, 0.15)'
                        : brandColors.primary,
                      borderColor: passenger.isBoarded ? 'rgba(239, 68, 68, 0.4)' : brandColors.primary,
                    },
                  ]}
                  onPress={() => handleToggleBoarding(passenger)}
                  disabled={isToggling}
                  activeOpacity={0.8}
                >
                  {isToggling ? (
                    <ActivityIndicator size="small" color={passenger.isBoarded ? '#ef4444' : '#000000'} />
                  ) : (
                    <Text
                      style={[
                        styles.boardActionText,
                        { color: passenger.isBoarded ? '#ef4444' : '#000000' },
                      ]}
                    >
                      {passenger.isBoarded ? 'Unboard' : 'Board'}
                    </Text>
                  )}
                </TouchableOpacity>
              </Card>
            );
          })}
        </View>
      )}
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
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  refreshButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  filterSection: {
    gap: 8,
  },
  tabPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  passengerList: {
    gap: 10,
  },
  passengerCard: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  seatBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatNumText: {
    fontSize: 15,
    fontWeight: '900',
  },
  passengerInfo: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passengerName: {
    fontSize: 15,
    fontWeight: '800',
  },
  routeStops: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  ticketIdText: {
    fontSize: 11,
  },
  phoneText: {
    fontSize: 11,
  },
  boardActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardActionText: {
    fontSize: 12,
    fontWeight: '900',
  },
  emptyListTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  emptyListSub: {
    fontSize: 13,
    textAlign: 'center',
  },
});
