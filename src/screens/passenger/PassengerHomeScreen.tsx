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
  const { isLight } = useTheme();
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
  const [gpsActive, setGpsActive] = useState(true);

  const handleSearchPress = async () => {
    await searchBuses();
    onNavigateToFindBus();
  };

  const { isLight, isAgro, colors } = useTheme();
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
  const [gpsActive, setGpsActive] = useState(true);

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

  // Color theme helpers
  const textDark = isAgro ? '#ffffff' : isLight ? '#0f172a' : '#f8fafc';
  const textMuted = isAgro ? '#8ba58b' : isLight ? '#64748b' : '#94a3b8';
  const cardBg = isAgro ? '#0e1c0e' : isLight ? '#ffffff' : '#1e293b';
  const cardBorder = isAgro ? 'rgba(163, 230, 53, 0.25)' : isLight ? '#e2e8f0' : '#334155';
  const inputBg = isAgro ? '#ffffff' : isLight ? '#ffffff' : '#0f172a';
  const inputBorder = isAgro ? 'rgba(163, 230, 53, 0.35)' : isLight ? '#cbd5e1' : '#334155';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isAgro ? '#071007' : isLight ? '#f8fafc' : '#0f172a' }]}
      contentContainerStyle={[
        styles.scrollContent,
        { padding: isMobile ? 14 : 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.innerWrapper}>
        {/* Welcome & Location Header */}
        <View
          style={[
            styles.topHeaderSection,
            isMobile ? styles.topHeaderSectionMobile : styles.topHeaderSectionDesktop,
          ]}
        >
          <View>
            <Text style={[styles.welcomeTitle, { color: textDark }]}>
              Welcome, Passenger 👋
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: textMuted }]}>
              Real-Time Bus & Highway Corridor Portal
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setAllStopsOpen(true)}
            activeOpacity={0.8}
            style={[
              styles.locationPill,
              {
                backgroundColor: isAgro ? '#0e1c0e' : isLight ? '#ffffff' : '#1e293b',
                borderColor: isAgro ? 'rgba(163, 230, 53, 0.35)' : isLight ? '#cbd5e1' : '#334155',
                alignSelf: isMobile ? 'flex-start' : 'auto',
                marginTop: isMobile ? 10 : 0,
              },
            ]}
          >
            <Text style={{ fontSize: 13, marginRight: 6 }}>📍</Text>
            <Text style={[styles.locationText, { color: textDark }]}>
              Current Location
            </Text>
            <Text style={{ fontSize: 10, color: textMuted, marginLeft: 5 }}>⌵</Text>
          </TouchableOpacity>
        </View>

        {/* GPS Location Permission Banner */}
        {!isLocationBannerDismissed && (
          <View
            style={[
              styles.gpsBanner,
              isMobile ? styles.gpsBannerMobile : styles.gpsBannerDesktop,
              {
                backgroundColor: isAgro ? 'rgba(163, 230, 53, 0.08)' : isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.08)',
                borderColor: isAgro ? 'rgba(163, 230, 53, 0.25)' : isLight ? '#a7f3d0' : 'rgba(0, 212, 136, 0.25)',
              },
            ]}
          >
            <View style={styles.gpsBannerTopRow}>
              <View
                style={[
                  styles.gpsIconBox,
                  { backgroundColor: isAgro ? 'rgba(163, 230, 53, 0.18)' : isLight ? '#d1fae5' : 'rgba(0, 212, 136, 0.15)' },
                ]}
              >
                <Text style={{ fontSize: 18 }}>📍</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gpsBannerTitle, { color: textDark }]}>
                  {gpsActive ? 'Turn on location for nearby services' : 'Turn on location for nearby services'}
                </Text>
                <Text style={[styles.gpsBannerDesc, { color: textMuted }]}>
                  Please turn on or update your location for accessing services and nearest stops around you.
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.gpsBannerActions,
                isMobile && {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  marginTop: 10,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setIsLocationBannerDismissed(true)}
                style={styles.dismissBtn}
              >
                <Text style={[styles.dismissText, { color: textMuted }]}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setGpsActive(!gpsActive)}
                activeOpacity={0.85}
                style={[
                  styles.turnOnGpsBtn,
                  { backgroundColor: isAgro ? '#A3E635' : '#00875A' },
                ]}
              >
                <Text style={[styles.turnOnGpsBtnText, isAgro && { color: '#071007', fontWeight: '900' }]}>
                  {gpsActive ? '✓ GPS Active' : 'Turn on GPS ➔'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Hero "Find and track your bus" Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              padding: isMobile ? 16 : 22,
            },
          ]}
        >
          <View style={styles.heroCardHeader}>
            <View
              style={[
                styles.searchIconBox,
                { backgroundColor: isAgro ? 'rgba(163, 230, 53, 0.15)' : '#e0f2fe' },
              ]}
            >
              <Text style={{ fontSize: 20 }}>🔍</Text>
            </View>
            <View>
              <Text style={[styles.heroCardTitle, { color: textDark }]}>
                Find and track your bus
              </Text>
              <Text style={[styles.heroCardSubtitle, { color: textMuted }]}>
                Search corridor routes, check seats, and track live satellite radar
              </Text>
            </View>
          </View>

          {/* Form Inputs Row */}
          <View style={[styles.inputsRow, isDesktop ? styles.inputsRowDesktop : styles.inputsRowMobile]}>
            {/* FROM (STARTING STOP) */}
            <View style={styles.inputFieldContainer}>
              <Text style={[styles.inputLabel, { color: textMuted }]}>
                FROM (STARTING STOP)
              </Text>
              <TouchableOpacity
                onPress={() => setAllStopsOpen(true)}
                activeOpacity={0.8}
                style={[
                  styles.fakeInput,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.fakeInputText,
                    { color: origin ? (isAgro ? '#071007' : textDark) : (isLight ? '#94a3b8' : '#64748b') },
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
              activeOpacity={0.8}
              style={[
                styles.swapButton,
                isMobile && { alignSelf: 'center', marginVertical: 4 },
                {
                  backgroundColor: isAgro ? '#071007' : isLight ? '#f1f5f9' : '#1e293b',
                  borderColor: isAgro ? 'rgba(163, 230, 53, 0.4)' : inputBorder,
                },
              ]}
            >
              <Text style={[styles.swapButtonText, { color: isAgro ? '#A3E635' : '#00D488' }]}>⇄</Text>
            </TouchableOpacity>

            {/* TO (DESTINATION) */}
            <View style={styles.inputFieldContainer}>
              <Text style={[styles.inputLabel, { color: textMuted }]}>
                TO (DESTINATION)
              </Text>
              <TouchableOpacity
                onPress={() => setAllStopsOpen(true)}
                activeOpacity={0.8}
                style={[
                  styles.fakeInput,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.fakeInputText,
                    { color: destination ? (isAgro ? '#071007' : textDark) : (isLight ? '#94a3b8' : '#64748b') },
                  ]}
                  numberOfLines={1}
                >
                  {destination || 'Destination...'}
                </Text>
                <Text style={{ fontSize: 13 }}>📍</Text>
              </TouchableOpacity>
            </View>

            {/* DATE OF JOURNEY */}
            <View style={[styles.dateFieldContainer, isMobile && { width: '100%' }]}>
              <Text style={[styles.inputLabel, { color: textMuted }]}>
                DATE OF JOURNEY
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setJourneyDate(journeyDate === '26-09-2026' ? '27-09-2026' : '26-09-2026');
                }}
                activeOpacity={0.8}
                style={[
                  styles.dateBox,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 13 }}>📅</Text>
                  <Text style={[styles.dateText, { color: isAgro ? '#071007' : textDark }]}>
                    {journeyDate}
                  </Text>
                </View>
                <View style={isMobile ? { flexDirection: 'row', alignItems: 'center' } : styles.selectDateCol}>
                  <Text style={[styles.selectDateText, isMobile && { fontSize: 10.5 }, isAgro && { color: '#071007' }]}>
                    SELECT DATE
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Search Buses Button */}
            <View style={[styles.searchBtnContainer, isMobile && { width: '100%', marginTop: 8 }]}>
              <TouchableOpacity
                onPress={handleSearchPress}
                activeOpacity={0.85}
                style={[
                  styles.searchButton,
                  isAgro && { backgroundColor: '#A3E635' },
                  isMobile && { width: '100%' },
                ]}
              >
                <Text style={{ fontSize: 14 }}>🔍</Text>
                <Text style={[styles.searchButtonText, isAgro && { color: '#071007', fontWeight: '900' }]}>
                  Search Buses
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Popular Corridors Chips */}
          <View style={styles.popularCorridorsSection}>
            <Text style={[styles.popularTitle, { color: textMuted }]}>
              POPULAR CORRIDOR ROUTES (TAP TO SEARCH):
            </Text>
            <View style={styles.chipsRow}>
              {POPULAR_CORRIDORS.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => handleCorridorPress(c.originStop, c.destinationStop)}
                  activeOpacity={0.8}
                  style={[
                    styles.corridorChip,
                    {
                      backgroundColor: isAgro ? 'rgba(163, 230, 53, 0.08)' : isLight ? '#f8fafc' : '#1e293b',
                      borderColor: isAgro ? 'rgba(163, 230, 53, 0.25)' : cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: isAgro ? '#d1e7d1' : isLight ? '#334155' : '#cbd5e1' }]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* QUICK PAYMENTS & PASSES Divider & 3-Card Grid */}
        <View style={styles.quickPassesSection}>
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: cardBorder }]} />
            <Text style={[styles.dividerLabel, { color: textMuted }]}>
              ✦ QUICK PAYMENTS & PASSES ✦
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: cardBorder }]} />
          </View>

          <View style={[styles.passesGrid, isDesktop ? styles.passesGridDesktop : styles.passesGridMobile]}>
            {/* Card 1: Buy mobile ticket */}
            <TouchableOpacity
              onPress={() => setBuyTicketModalOpen(true)}
              activeOpacity={0.8}
              style={[
                styles.passCard,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                },
              ]}
            >
              <View style={[styles.passIconBox, { backgroundColor: '#fee2e2' }]}>
                <Text style={{ fontSize: 18 }}>🎟️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.passCardTitle, { color: textDark }]}>
                  Buy mobile ticket
                </Text>
                <Text style={[styles.passCardSub, { color: textMuted }]}>
                  Pay with wallet, UPI or cards
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: '#00D488', fontWeight: '800' }}>➔</Text>
            </TouchableOpacity>

            {/* Card 2: My tickets / passes */}
            <TouchableOpacity
              onPress={onNavigateToTickets}
              activeOpacity={0.8}
              style={[
                styles.passCard,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                },
              ]}
            >
              <View style={[styles.passIconBox, { backgroundColor: '#e0f2fe' }]}>
                <Text style={{ fontSize: 18 }}>💳</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.passCardTitle, { color: textDark }]}>
                  My tickets / passes ({tickets.length})
                </Text>
                <Text style={[styles.passCardSub, { color: textMuted }]}>
                  Active QR boarding passes
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: '#0284c7', fontWeight: '800' }}>➔</Text>
            </TouchableOpacity>

            {/* Card 3: Daily Corridor Pass */}
            <TouchableOpacity
              onPress={() => setBuyTicketModalOpen(true)}
              activeOpacity={0.8}
              style={[
                styles.passCard,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                },
              ]}
            >
              <View style={[styles.passIconBox, { backgroundColor: '#fef3c7' }]}>
                <Text style={{ fontSize: 18 }}>⚡</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.passCardTitle, { color: textDark }]}>
                  Daily Corridor Pass
                </Text>
                <Text style={[styles.passCardSub, { color: textMuted }]}>
                  Unlimited travel · From ₹99
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: '#d97706', fontWeight: '800' }}>➔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nearest bus stop Section */}
        <View style={styles.nearestStopSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: textDark }]}>
              Nearest bus stop
            </Text>
            <TouchableOpacity onPress={() => setAllStopsOpen(true)} activeOpacity={0.8}>
              <Text style={styles.seeAllStopsText}>See all stops ➔</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.nearestCard,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            <View style={styles.nearestCardTop}>
              <View style={styles.stopIconCircle}>
                <Text style={{ fontSize: 20 }}>🚏</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.nearestStopTitle, { color: textDark }]}>
                  {FALLBACK_STOPS[0]?.name || 'Ajmeri Gate Chowk'}
                </Text>
                <Text style={styles.nearestStopSubtitle}>
                  {FALLBACK_STOPS[0]?.name || 'Ajmeri Gate Chowk'} · Highway Marker 0 km
                </Text>
              </View>
              <View
                style={[
                  styles.distancePill,
                  {
                    backgroundColor: isLight ? '#f8fafc' : '#0f172a',
                    borderColor: cardBorder,
                  },
                ]}
              >
                <Text style={[styles.distancePillText, { color: isLight ? '#334155' : '#cbd5e1' }]}>
                  🚶 1 min away (90m)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() =>
                handleCorridorPress(
                  FALLBACK_STOPS[0]?.name || 'Ajmeri Gate Chowk',
                  'Puri Bus Stand (Bada Danda)'
                )
              }
              activeOpacity={0.8}
              style={[
                styles.seeBusesLink,
                { borderTopColor: isLight ? '#f1f5f9' : '#334155' },
              ]}
            >
              <Text style={styles.seeBusesLinkText}>
                See all buses passing {FALLBACK_STOPS[0]?.name || 'Ajmeri Gate Chowk'} ➔
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Buses around you Section */}
        <View style={styles.busesAroundSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: textDark }]}>
              Buses around you
            </Text>
            <View
              style={[
                styles.fleetBadgePill,
                {
                  backgroundColor: isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.12)',
                  borderColor: isLight ? '#a7f3d0' : 'rgba(0, 212, 136, 0.3)',
                },
              ]}
            >
              <Text style={styles.fleetBadgeText}>
                ● 0 Fleet Vehicles Live
              </Text>
            </View>
          </View>

          {/* Fallback Buses List */}
          <View style={styles.busesList}>
            {FALLBACK_BUSES.map((bus) => (
              <View
                key={bus.id}
                style={[
                  styles.liveBusMiniCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                  },
                ]}
              >
                <View style={styles.liveBusMiniHeader}>
                  <View style={styles.busMiniIcon}>
                    <Text style={{ fontSize: 18 }}>🚌</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.liveBusName, { color: textDark }]}>
                        {bus.busModel}
                      </Text>
                      {bus.isLive && (
                        <View style={styles.livePill}>
                          <Text style={styles.livePillText}>LIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.liveBusRoute, { color: textMuted }]}>
                      {bus.routeName} · {bus.busRegistration}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.liveBusFare}>₹{bus.fare}</Text>
                    <Text style={styles.liveBusSeats}>
                      {bus.availableSeats} seats left
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.liveBusMiniFooter,
                    { borderTopColor: isLight ? '#f1f5f9' : '#334155' },
                  ]}
                >
                  <Text style={[styles.liveBusSpeed, { color: textMuted }]}>
                    {bus.isLive
                      ? `Speed: ${bus.currentSpeedKmH || 48} km/h · Next: ${bus.nextStopName}`
                      : 'Scheduled Departure'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => selectTrip(bus)}
                      activeOpacity={0.8}
                      style={[
                        styles.selectSeatsBtn,
                        {
                          backgroundColor: isLight ? '#ffffff' : '#0f172a',
                          borderColor: inputBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.selectSeatsBtnText, { color: textDark }]}>
                        Select Seats
                      </Text>
                    </TouchableOpacity>
                    {bus.isLive && onOpenLiveTrack && (
                      <TouchableOpacity
                        onPress={() => onOpenLiveTrack(bus.tripId)}
                        activeOpacity={0.85}
                        style={styles.radarBtn}
                      >
                        <Text style={styles.radarBtnText}>Radar 📡</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  innerWrapper: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  topHeaderSection: {
    marginBottom: 16,
  },
  topHeaderSectionDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topHeaderSectionMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  agroCapsuleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    marginBottom: 6,
  },
  agroCapsuleText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  welcomeTitleHighlight: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 18,
  },
  searchButtonAgro: {
    backgroundColor: '#A3E635',
    borderRadius: 9999,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderWidth: 0,
    shadowColor: '#A3E635',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  searchButtonTextAgro: {
    color: '#071007',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  locationText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  gpsBanner: {
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
    padding: 14,
  },
  gpsBannerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  gpsBannerMobile: {
    flexDirection: 'column',
  },
  gpsBannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gpsIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsBannerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  gpsBannerDesc: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  gpsBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dismissBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  dismissText: {
    fontSize: 12,
    fontWeight: '600',
  },
  turnOnGpsBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnOnGpsBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  heroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  searchIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  heroCardSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  inputsRow: {
    gap: 10,
    marginBottom: 14,
  },
  inputsRowDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputsRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  inputFieldContainer: {
    flex: 1,
    gap: 5,
  },
  inputLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fakeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  fakeInputText: {
    fontSize: 13,
    fontWeight: '600',
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  swapButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  dateFieldContainer: {
    minWidth: 160,
    gap: 5,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  dateText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  selectDateCol: {
    alignItems: 'flex-end',
  },
  selectDateText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00D488',
  },
  searchBtnContainer: {
    minWidth: 150,
  },
  searchButton: {
    height: 44,
    backgroundColor: '#00875A',
    borderRadius: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  popularCorridorsSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  popularTitle: {
    fontSize: 9.5,
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
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.5,
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
    fontSize: 12.5,
    fontWeight: '700',
    color: '#00875A',
  },
  nearestCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
  },
  nearestCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  stopIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearestStopTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  nearestStopSubtitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#047857',
    marginTop: 2,
  },
  distancePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  distancePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  seeBusesLink: {
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  seeBusesLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00875A',
  },
  busesAroundSection: {
    marginBottom: 24,
  },
  fleetBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  fleetBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  busesList: {
    gap: 10,
  },
  liveBusMiniCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
  },
  liveBusMiniHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  busMiniIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 212, 136, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBusName: {
    fontSize: 13,
    fontWeight: '800',
  },
  livePill: {
    backgroundColor: 'rgba(0, 212, 136, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  livePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#00D488',
  },
  liveBusRoute: {
    fontSize: 11,
    marginTop: 1,
  },
  liveBusFare: {
    fontSize: 17,
    fontWeight: '900',
    color: '#00D488',
  },
  liveBusSeats: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#047857',
    marginTop: 1,
  },
  liveBusMiniFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  liveBusSpeed: {
    fontSize: 11,
    fontWeight: '600',
  },
  selectSeatsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  selectSeatsBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  radarBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#00D488',
  },
  radarBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#002e1c',
  },
});
