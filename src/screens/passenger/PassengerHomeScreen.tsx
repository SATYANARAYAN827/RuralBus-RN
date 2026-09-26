import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { Card, Button, Badge } from '../../components/common';
import { usePassengerStore } from '../../stores/passenger.store';
import { POPULAR_CORRIDORS, FALLBACK_STOPS, FALLBACK_BUSES } from '../../services/passenger.service';

interface PassengerHomeScreenProps {
  onNavigateToFindBus: () => void;
  onNavigateToTickets: () => void;
  onOpenLiveTrack?: (tripId: string) => void;
}

export const PassengerHomeScreen: React.FC<PassengerHomeScreenProps> = ({
  onNavigateToFindBus,
  onNavigateToTickets,
  onOpenLiveTrack,
}) => {
  const { colors, isLight } = useTheme();
  const { isDesktop, isMobile } = useResponsive();
  const {
    origin,
    destination,
    journeyDate,
    setOrigin,
    setDestination,
    setJourneyDate,
    swapOriginDestination,
    searchBuses,
    tickets,
    setAllStopsOpen,
    setBuyTicketModalOpen,
    selectTrip,
  } = usePassengerStore();

  const [isLocationBannerDismissed, setIsLocationBannerDismissed] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);

  const handleSearchPress = async () => {
    await searchBuses();
    onNavigateToFindBus();
  };

  const handleCorridorPress = async (orig: string, dest: string) => {
    setOrigin(orig);
    setDestination(dest);
    await searchBuses();
    onNavigateToFindBus();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome & Location Header */}
      <View style={styles.topHeaderSection}>
        <View>
          <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>
            Welcome, Passenger 👋
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
            Real-Time Bus & Highway Corridor Portal
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setAllStopsOpen(true)}
          style={[
            styles.locationPill,
            {
              backgroundColor: isLight ? '#ffffff' : '#1e293b',
              borderColor: isLight ? '#cbd5e1' : '#334155',
            },
          ]}
        >
          <Text style={{ fontSize: 13, marginRight: 6 }}>📍</Text>
          <Text style={[styles.locationText, { color: colors.textPrimary }]}>
            Current Location
          </Text>
          <Text style={{ fontSize: 10, color: colors.textMuted, marginLeft: 4 }}>⌄</Text>
        </TouchableOpacity>
      </View>

      {/* GPS Location Permission Banner */}
      {!isLocationBannerDismissed && (
        <View
          style={[
            styles.gpsBanner,
            {
              backgroundColor: isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.08)',
              borderColor: '#a7f3d0',
            },
          ]}
        >
          <View style={styles.gpsIconBox}>
            <Text style={{ fontSize: 18 }}>📍</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.gpsBannerTitle, { color: '#047857' }]}>
              {gpsActive ? 'GPS Location Connected' : 'Turn on location for nearby services'}
            </Text>
            <Text style={[styles.gpsBannerDesc, { color: colors.textSecondary }]}>
              {gpsActive
                ? 'High-precision corridor GPS active. Closest transit stop: Ajmeri Gate Chowk.'
                : 'Please turn on or update your location for accessing services and nearest stops around you.'}
            </Text>
          </View>
          <View style={styles.gpsBannerActions}>
            <TouchableOpacity
              onPress={() => setIsLocationBannerDismissed(true)}
              style={styles.dismissBtn}
            >
              <Text style={[styles.dismissText, { color: colors.textMuted }]}>Dismiss</Text>
            </TouchableOpacity>
            <Button
              title={gpsActive ? 'GPS Active ✓' : 'Turn on GPS ➔'}
              variant="mint"
              size="sm"
              onPress={() => setGpsActive(!gpsActive)}
            />
          </View>
        </View>
      )}

      {/* Hero "Find and track your bus" Card */}
      <Card
        padding={isMobile ? 16 : 22}
        style={styles.heroCard}
      >
        <View style={styles.heroCardHeader}>
          <View style={styles.searchIconBox}>
            <Text style={{ fontSize: 20 }}>🔍</Text>
          </View>
          <View>
            <Text style={[styles.heroCardTitle, { color: colors.textPrimary }]}>
              Find and track your bus
            </Text>
            <Text style={[styles.heroCardSubtitle, { color: colors.textMuted }]}>
              Search corridor routes, check seats, and track live satellite radar
            </Text>
          </View>
        </View>

        {/* Inputs Layout */}
        <View style={[styles.inputsRow, isDesktop ? styles.inputsRowDesktop : styles.inputsRowMobile]}>
          {/* Starting Stop */}
          <View style={styles.inputFieldContainer}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              FROM (STARTING STOP)
            </Text>
            <TouchableOpacity
              onPress={() => setAllStopsOpen(true)}
              style={[
                styles.fakeInput,
                {
                  backgroundColor: isLight ? '#ffffff' : '#1e293b',
                  borderColor: isLight ? '#cbd5e1' : '#334155',
                },
              ]}
            >
              <Text
                style={[
                  styles.fakeInputText,
                  { color: origin ? colors.textPrimary : colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {origin || 'Starting stop...'}
              </Text>
              <Text style={{ fontSize: 13 }}>📍</Text>
            </TouchableOpacity>
          </View>

          {/* Swap Button */}
          <TouchableOpacity
            onPress={swapOriginDestination}
            style={[
              styles.swapButton,
              {
                backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
                borderColor: isLight ? '#cbd5e1' : '#475569',
              },
            ]}
          >
            <Text style={{ fontSize: 16 }}>⇄</Text>
          </TouchableOpacity>

          {/* Destination */}
          <View style={styles.inputFieldContainer}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              TO (DESTINATION)
            </Text>
            <TouchableOpacity
              onPress={() => setAllStopsOpen(true)}
              style={[
                styles.fakeInput,
                {
                  backgroundColor: isLight ? '#ffffff' : '#1e293b',
                  borderColor: isLight ? '#cbd5e1' : '#334155',
                },
              ]}
            >
              <Text
                style={[
                  styles.fakeInputText,
                  { color: destination ? colors.textPrimary : colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {destination || 'Destination...'}
              </Text>
              <Text style={{ fontSize: 13 }}>📍</Text>
            </TouchableOpacity>
          </View>

          {/* Date Picker Display */}
          <View style={styles.dateFieldContainer}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              DATE OF JOURNEY
            </Text>
            <View
              style={[
                styles.dateBox,
                {
                  backgroundColor: isLight ? '#ffffff' : '#1e293b',
                  borderColor: isLight ? '#cbd5e1' : '#334155',
                },
              ]}
            >
              <Text style={{ fontSize: 14, marginRight: 6 }}>📅</Text>
              <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                {journeyDate}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setJourneyDate(journeyDate === '25-09-2026' ? '26-09-2026' : '25-09-2026');
                }}
              >
                <Text style={styles.selectDateText}>SELECT DATE</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Button */}
          <View style={styles.searchBtnContainer}>
            <Button
              title="Search Buses"
              icon="🔍"
              variant="primary"
              size="lg"
              onPress={handleSearchPress}
            />
          </View>
        </View>

        {/* Popular Corridors Chips */}
        <View style={styles.popularCorridorsSection}>
          <Text style={[styles.popularTitle, { color: colors.textSecondary }]}>
            POPULAR CORRIDOR ROUTES (TAP TO SEARCH):
          </Text>
          <View style={styles.chipsRow}>
            {POPULAR_CORRIDORS.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => handleCorridorPress(c.originStop, c.destinationStop)}
                style={[
                  styles.corridorChip,
                  {
                    backgroundColor: isLight ? '#f8fafc' : '#1e293b',
                    borderColor: isLight ? '#e2e8f0' : '#334155',
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: colors.textPrimary }]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>

      {/* QUICK PAYMENTS & PASSES Divider & Grid */}
      <View style={styles.quickPassesSection}>
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: isLight ? '#e2e8f0' : '#334155' }]} />
          <Text style={[styles.dividerLabel, { color: colors.textMuted }]}>
            ✦ QUICK PAYMENTS & PASSES ✦
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: isLight ? '#e2e8f0' : '#334155' }]} />
        </View>

        <View style={[styles.passesGrid, isDesktop ? styles.passesGridDesktop : styles.passesGridMobile]}>
          {/* Card 1: Buy mobile ticket */}
          <TouchableOpacity
            onPress={() => setBuyTicketModalOpen(true)}
            style={[
              styles.passCard,
              {
                backgroundColor: isLight ? '#ffffff' : '#1e293b',
                borderColor: isLight ? '#e2e8f0' : '#334155',
              },
            ]}
          >
            <View style={[styles.passIconBox, { backgroundColor: '#fee2e2' }]}>
              <Text style={{ fontSize: 18 }}>🎟️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.passCardTitle, { color: colors.textPrimary }]}>
                Buy mobile ticket
              </Text>
              <Text style={[styles.passCardSub, { color: colors.textSecondary }]}>
                Pay with wallet, UPI or cards
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: '#00D488' }}>➔</Text>
          </TouchableOpacity>

          {/* Card 2: My tickets / passes */}
          <TouchableOpacity
            onPress={onNavigateToTickets}
            style={[
              styles.passCard,
              {
                backgroundColor: isLight ? '#ffffff' : '#1e293b',
                borderColor: isLight ? '#e2e8f0' : '#334155',
              },
            ]}
          >
            <View style={[styles.passIconBox, { backgroundColor: '#e0f2fe' }]}>
              <Text style={{ fontSize: 18 }}>🎫</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.passCardTitle, { color: colors.textPrimary }]}>
                My tickets / passes ({tickets.length})
              </Text>
              <Text style={[styles.passCardSub, { color: colors.textSecondary }]}>
                Active QR boarding passes
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: '#0284c7' }}>➔</Text>
          </TouchableOpacity>

          {/* Card 3: Daily Corridor Pass */}
          <TouchableOpacity
            onPress={() => setBuyTicketModalOpen(true)}
            style={[
              styles.passCard,
              {
                backgroundColor: isLight ? '#ffffff' : '#1e293b',
                borderColor: isLight ? '#e2e8f0' : '#334155',
              },
            ]}
          >
            <View style={[styles.passIconBox, { backgroundColor: '#fef3c7' }]}>
              <Text style={{ fontSize: 18 }}>⚡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.passCardTitle, { color: colors.textPrimary }]}>
                Daily Corridor Pass
              </Text>
              <Text style={[styles.passCardSub, { color: colors.textSecondary }]}>
                Unlimited travel · From ₹99
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: '#d97706' }}>➔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Nearest bus stop Section */}
      <View style={styles.nearestStopSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            Nearest bus stop
          </Text>
          <TouchableOpacity onPress={() => setAllStopsOpen(true)}>
            <Text style={styles.seeAllStopsText}>See all stops ➔</Text>
          </TouchableOpacity>
        </View>

        <Card padding={16} style={styles.nearestCard}>
          <View style={styles.nearestCardTop}>
            <View style={styles.stopIconCircle}>
              <Text style={{ fontSize: 20 }}>🚏</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nearestStopTitle, { color: colors.textPrimary }]}>
                {FALLBACK_STOPS[0].name}
              </Text>
              <Text style={[styles.nearestStopSubtitle, { color: colors.textSecondary }]}>
                {FALLBACK_STOPS[0].name} · Highway Marker 0 km
              </Text>
            </View>
            <View style={[styles.distancePill, { backgroundColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
              <Text style={[styles.distancePillText, { color: colors.textPrimary }]}>
                🚶 1 min away (90m)
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handleCorridorPress(FALLBACK_STOPS[0].name, 'Puri Bus Stand (Bada Danda)')}
            style={styles.seeBusesLink}
          >
            <Text style={styles.seeBusesLinkText}>
              See all buses passing {FALLBACK_STOPS[0].name} ➔
            </Text>
          </TouchableOpacity>
        </Card>
      </View>

      {/* Buses around you Section */}
      <View style={styles.busesAroundSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            Buses around you
          </Text>
          <Badge variant="mint" label="● 3 Fleet Vehicles Live" />
        </View>

        <View style={styles.busesList}>
          {FALLBACK_BUSES.map((bus) => (
            <Card key={bus.id} padding={14} style={styles.liveBusMiniCard}>
              <View style={styles.liveBusMiniHeader}>
                <View style={styles.busMiniIcon}>
                  <Text style={{ fontSize: 18 }}>🚌</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.liveBusName, { color: colors.textPrimary }]}>
                      {bus.busModel}
                    </Text>
                    {bus.isLive && <Badge variant="success" label="LIVE" />}
                  </View>
                  <Text style={[styles.liveBusRoute, { color: colors.textSecondary }]}>
                    {bus.routeName} · {bus.busRegistration}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.liveBusFare}>₹{bus.fare}</Text>
                  <Text style={[styles.liveBusSeats, { color: '#047857' }]}>
                    {bus.availableSeats} seats left
                  </Text>
                </View>
              </View>

              <View style={styles.liveBusMiniFooter}>
                <Text style={[styles.liveBusSpeed, { color: colors.textMuted }]}>
                  {bus.isLive ? `Speed: ${bus.currentSpeedKmH || 48} km/h · Next: ${bus.nextStopName}` : 'Scheduled Departure'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    title="Select Seats"
                    variant="outline"
                    size="sm"
                    onPress={() => selectTrip(bus)}
                  />
                  {bus.isLive && onOpenLiveTrack && (
                    <Button
                      title="Radar 📡"
                      variant="mint"
                      size="sm"
                      onPress={() => onOpenLiveTrack(bus.tripId)}
                    />
                  )}
                </View>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  topHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '700',
  },
  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 12,
  },
  gpsIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  gpsBannerDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  gpsBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dismissBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  dismissText: {
    fontSize: 11,
    fontWeight: '600',
  },
  heroCard: {
    marginBottom: 20,
  },
  heroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  searchIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 212, 136, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCardTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  heroCardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  inputsRow: {
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 16,
  },
  inputsRowDesktop: {
    flexDirection: 'row',
  },
  inputsRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  inputFieldContainer: {
    flex: 2,
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fakeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  fakeInputText: {
    fontSize: 13,
    fontWeight: '600',
  },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  dateFieldContainer: {
    flex: 1.5,
    gap: 6,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  selectDateText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00D488',
  },
  searchBtnContainer: {
    flex: 1.5,
  },
  popularCorridorsSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  popularTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  corridorChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickPassesSection: {
    marginBottom: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  passesGrid: {
    gap: 12,
  },
  passesGridDesktop: {
    flexDirection: 'row',
  },
  passesGridMobile: {
    flexDirection: 'column',
  },
  passCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  passIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  passCardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  nearestStopSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  seeAllStopsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00D488',
  },
  nearestCard: {
    borderRadius: 16,
  },
  nearestCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  stopIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearestStopTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  nearestStopSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  distancePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  distancePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  seeBusesLink: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  seeBusesLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00D488',
  },
  busesAroundSection: {
    marginBottom: 30,
  },
  busesList: {
    gap: 10,
  },
  liveBusMiniCard: {
    borderRadius: 14,
  },
  liveBusMiniHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  busMiniIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 212, 136, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBusName: {
    fontSize: 13,
    fontWeight: '800',
  },
  liveBusRoute: {
    fontSize: 11,
    marginTop: 2,
  },
  liveBusFare: {
    fontSize: 18,
    fontWeight: '900',
    color: '#00D488',
  },
  liveBusSeats: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  liveBusMiniFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  liveBusSpeed: {
    fontSize: 11,
    fontWeight: '600',
  },
});
