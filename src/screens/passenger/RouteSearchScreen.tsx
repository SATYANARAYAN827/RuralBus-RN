import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { Card, Button, TextInput, Badge } from '../../components/common';
import { usePassengerStore } from '../../stores/passenger.store';
import { POPULAR_CORRIDORS } from '../../services/passenger.service';

interface RouteSearchScreenProps {
  onSearchComplete: () => void;
}

export const RouteSearchScreen: React.FC<RouteSearchScreenProps> = ({
  onSearchComplete,
}) => {
  const { colors, isLight } = useTheme();
  const { isDesktop } = useResponsive();
  const {
    origin,
    destination,
    journeyDate,
    busTypeFilter,
    setOrigin,
    setDestination,
    setJourneyDate,
    setBusTypeFilter,
    swapOriginDestination,
    searchBuses,
    isLoadingTrips,
    setAllStopsOpen,
  } = usePassengerStore();

  const handleSearch = async () => {
    await searchBuses();
    onSearchComplete();
  };

  const handleSelectCorridor = async (orig: string, dest: string) => {
    setOrigin(orig);
    setDestination(dest);
    await searchBuses();
    onSearchComplete();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Find Your Highway Bus
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Search rural transit routes, seat availability, and live radar tracking
        </Text>
      </View>

      {/* Main Search Card */}
      <Card padding={20} style={styles.searchCard}>
        {/* Origin Input */}
        <View style={styles.inputWrapper}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            FROM (STARTING STOP)
          </Text>
          <View style={styles.inputWithAction}>
            <TextInput
              placeholder="e.g. Baramunda ISBT"
              value={origin}
              onChangeText={setOrigin}
              leftIcon="📍"
            />
            <TouchableOpacity
              onPress={() => setAllStopsOpen(true)}
              style={styles.browseStopsBtn}
            >
              <Text style={styles.browseStopsText}>Browse All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Swap Button Divider */}
        <View style={styles.swapDivider}>
          <View style={[styles.swapLine, { backgroundColor: isLight ? '#e2e8f0' : '#334155' }]} />
          <TouchableOpacity
            onPress={swapOriginDestination}
            style={[
              styles.swapRoundBtn,
              {
                backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
                borderColor: isLight ? '#cbd5e1' : '#475569',
              },
            ]}
          >
            <Text style={{ fontSize: 16 }}>⇅</Text>
          </TouchableOpacity>
          <View style={[styles.swapLine, { backgroundColor: isLight ? '#e2e8f0' : '#334155' }]} />
        </View>

        {/* Destination Input */}
        <View style={styles.inputWrapper}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            TO (DESTINATION)
          </Text>
          <View style={styles.inputWithAction}>
            <TextInput
              placeholder="e.g. Puri Bus Stand"
              value={destination}
              onChangeText={setDestination}
              leftIcon="🎯"
            />
            <TouchableOpacity
              onPress={() => setAllStopsOpen(true)}
              style={styles.browseStopsBtn}
            >
              <Text style={styles.browseStopsText}>Browse All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date of Journey with Quick Chips */}
        <View style={styles.dateSection}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            DATE OF JOURNEY
          </Text>
          <View style={styles.dateChipsRow}>
            <TouchableOpacity
              onPress={() => setJourneyDate('25-09-2026')}
              style={[
                styles.dateChip,
                {
                  backgroundColor: journeyDate === '25-09-2026' ? '#ecfdf5' : (isLight ? '#f8fafc' : '#1e293b'),
                  borderColor: journeyDate === '25-09-2026' ? '#00D488' : (isLight ? '#cbd5e1' : '#334155'),
                },
              ]}
            >
              <Text style={[styles.dateChipTitle, { color: journeyDate === '25-09-2026' ? '#047857' : colors.textPrimary }]}>
                Today (25 Sep)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setJourneyDate('26-09-2026')}
              style={[
                styles.dateChip,
                {
                  backgroundColor: journeyDate === '26-09-2026' ? '#ecfdf5' : (isLight ? '#f8fafc' : '#1e293b'),
                  borderColor: journeyDate === '26-09-2026' ? '#00D488' : (isLight ? '#cbd5e1' : '#334155'),
                },
              ]}
            >
              <Text style={[styles.dateChipTitle, { color: journeyDate === '26-09-2026' ? '#047857' : colors.textPrimary }]}>
                Tomorrow (26 Sep)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bus Type Filter Tabs */}
        <View style={styles.filterSection}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            VEHICLE CATEGORY
          </Text>
          <View style={styles.filterRow}>
            {['ALL', 'AC Deluxe', 'Express Seater', 'Ordinary'].map((type) => {
              const isSelected = busTypeFilter === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setBusTypeFilter(type)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: isSelected ? '#ecfdf5' : (isLight ? '#f8fafc' : '#1e293b'),
                      borderColor: isSelected ? '#00D488' : (isLight ? '#cbd5e1' : '#334155'),
                    },
                  ]}
                >
                  <Text style={[styles.typeChipText, { color: isSelected ? '#047857' : colors.textSecondary }]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Search CTA */}
        <Button
          title={isLoadingTrips ? 'Scanning Rural Corridors...' : 'Search Available Buses ➔'}
          icon="🔍"
          variant="primary"
          size="lg"
          isLoading={isLoadingTrips}
          onPress={handleSearch}
        />
      </Card>

      {/* Popular Corridors List */}
      <View style={styles.corridorsSection}>
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
          Approved Highway Corridors
        </Text>

        <View style={styles.corridorsList}>
          {POPULAR_CORRIDORS.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => handleSelectCorridor(c.originStop, c.destinationStop)}
              style={[
                styles.corridorCard,
                {
                  backgroundColor: isLight ? '#ffffff' : '#1e293b',
                  borderColor: isLight ? '#e2e8f0' : '#334155',
                },
              ]}
            >
              <View style={styles.corridorIcon}>
                <Text style={{ fontSize: 18 }}>🛣️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.corridorCode, { color: '#047857' }]}>
                    {c.code}
                  </Text>
                  <Text style={[styles.corridorDist, { color: colors.textMuted }]}>
                    · {c.distanceKm} km
                  </Text>
                </View>
                <Text style={[styles.corridorName, { color: colors.textPrimary }]}>
                  {c.name}
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: '#00D488' }}>➔</Text>
            </TouchableOpacity>
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
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  searchCard: {
    marginBottom: 20,
    gap: 12,
  },
  inputWrapper: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  inputWithAction: {
    position: 'relative',
  },
  browseStopsBtn: {
    position: 'absolute',
    right: 10,
    top: 36,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 212, 136, 0.1)',
  },
  browseStopsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00D488',
  },
  swapDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: -4,
  },
  swapLine: {
    flex: 1,
    height: 1,
  },
  swapRoundBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  dateSection: {
    gap: 6,
  },
  dateChipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  dateChipTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterSection: {
    gap: 6,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  corridorsSection: {
    marginBottom: 30,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  corridorsList: {
    gap: 8,
  },
  corridorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  corridorIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corridorCode: {
    fontSize: 11,
    fontWeight: '800',
  },
  corridorDist: {
    fontSize: 11,
  },
  corridorName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
});
