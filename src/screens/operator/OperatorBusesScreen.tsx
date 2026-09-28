/**
 * Operator Fleet Buses Screen
 * Authoritative bus fleet management:
 * - Fleet list with real backend status
 * - Status filtering (ALL, ACTIVE, MAINTENANCE, PENDING_APPROVAL, DECOMMISSIONED)
 * - Registration, editing, decommissioning
 * - Driver & Conductor assignment inspection
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Card, Badge, Button, TextInput, LoadingIndicator, EmptyState, ErrorState } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useOperatorStore } from '../../stores/operator.store';
import { FleetBus, BusStatus } from '../../types/operator.types';

export const OperatorBusesScreen: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    buses,
    totalBuses,
    activeBusesCount,
    maintenanceBusesCount,
    busStatusFilter,
    setBusStatusFilter,
    busSearchQuery,
    setBusSearchQuery,
    isLoadingBuses,
    busError,
    fetchBuses,
    updateBus,
    setIsAddBusModalOpen,
    setIsEditBusModalOpen,
    setEditingBus,
  } = useOperatorStore();

  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  const filteredBuses = buses.filter((b) => {
    if (busStatusFilter !== 'ALL' && b.status !== busStatusFilter) return false;
    if (busSearchQuery.trim()) {
      const q = busSearchQuery.toLowerCase();
      const matchReg = b.registrationNumber?.toLowerCase().includes(q);
      const matchModel = b.model?.toLowerCase().includes(q);
      return matchReg || matchModel;
    }
    return true;
  });

  const getStatusBadge = (status: BusStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge label="ACTIVE" variant="mint" size="sm" />;
      case 'PENDING_APPROVAL':
        return <Badge label="PENDING APPROVAL" variant="warning" size="sm" />;
      case 'MAINTENANCE':
        return <Badge label="MAINTENANCE" variant="neutral" size="sm" />;
      case 'DECOMMISSIONED':
        return <Badge label="DECOMMISSIONED" variant="danger" size="sm" />;
      default:
        return <Badge label={status} variant="neutral" size="sm" />;
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, isMobile && styles.mobileContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header & Register Action */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            Fleet Buses ({totalBuses})
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
            {activeBusesCount} Active • {maintenanceBusesCount} Maintenance
          </Text>
        </View>
        <Button
          title="+ Register Bus"
          variant="mint"
          size="sm"
          onPress={() => setIsAddBusModalOpen(true)}
        />
      </View>

      {/* 2. Search & Status Filter Pills */}
      <Card padding={12} style={styles.filterCard}>
        <TextInput
          placeholder="Search by registration number or model..."
          value={busSearchQuery}
          onChangeText={setBusSearchQuery}
          style={styles.searchInput}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusPillsRow}
        >
          {(['ALL', 'ACTIVE', 'PENDING_APPROVAL', 'MAINTENANCE', 'DECOMMISSIONED'] as const).map(
            (status) => {
              const isSelected = busStatusFilter === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isSelected
                        ? '#00D488'
                        : isLight
                        ? '#f1f5f9'
                        : 'rgba(255,255,255,0.06)',
                    },
                  ]}
                  onPress={() => setBusStatusFilter(status)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      { color: isSelected ? '#000000' : colors.textPrimary },
                    ]}
                  >
                    {status.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </ScrollView>
      </Card>

      {/* 3. Loading / Error / Empty States */}
      {isLoadingBuses && (
        <Card padding={24} style={styles.stateCard}>
          <LoadingIndicator message="Loading fleet vehicles..." />
        </Card>
      )}

      {busError && (
        <Card padding={16} style={[styles.stateCard, { borderColor: '#ef4444' }]}>
          <ErrorState
            title="Failed to Load Buses"
            message={busError}
            retryLabel="Retry"
            onRetry={fetchBuses}
          />
        </Card>
      )}

      {!isLoadingBuses && filteredBuses.length === 0 && (
        <Card padding={32} style={styles.stateCard}>
          <EmptyState
            title="No Buses Found"
            description={
              busSearchQuery || busStatusFilter !== 'ALL'
                ? 'No fleet buses match the current filter or search criteria.'
                : 'No buses have been registered under this operator tenant yet.'
            }
            icon="🚌"
            action={{
              label: '+ Register First Bus',
              onPress: () => setIsAddBusModalOpen(true),
            }}
          />
        </Card>
      )}

      {/* 4. Bus Cards List */}
      <View style={styles.busListGrid}>
        {filteredBuses.map((bus) => (
          <Card
            key={bus.id}
            padding={16}
            style={[
              styles.busCard,
              {
                backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)',
              },
            ]}
          >
            <View style={styles.busCardHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  {getStatusBadge(bus.status)}
                  <Badge
                    label={bus.seatingType?.replace('_', ' ') || 'SEATER'}
                    variant="neutral"
                    size="sm"
                  />
                </View>
                <Text style={[styles.regNumber, { color: colors.textPrimary }]}>
                  {bus.registrationNumber || 'UNREGISTERED'}
                </Text>
                <Text style={[styles.busModel, { color: colors.textSecondary }]}>
                  {bus.model} • {bus.totalSeats} Total Seats
                </Text>
              </View>

              <Button
                title="Edit / Assign"
                variant="outline"
                size="sm"
                onPress={() => {
                  setEditingBus(bus);
                  setIsEditBusModalOpen(true);
                }}
              />
            </View>

            {/* Crew Assignments */}
            <View style={styles.crewSection}>
              <View style={styles.crewCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.crewRole}>ASSIGNED DRIVER</Text>
                  {Boolean(bus.assignedDriver || bus.driverName || bus.driver) && (
                    <TouchableOpacity
                      onPress={() => updateBus(bus.id, { driverId: null })}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 10, color: '#f43f5e', fontWeight: '800' }}>Unassign</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text
                  style={[
                    styles.crewName,
                    {
                      color: (bus.assignedDriver || bus.driverName || bus.driver)
                        ? (isLight ? '#047857' : '#00D488')
                        : colors.textMuted,
                      fontWeight: (bus.assignedDriver || bus.driverName || bus.driver) ? '800' : '500',
                    },
                  ]}
                >
                  {(bus.assignedDriver?.name || bus.driverName || bus.driver)
                    ? `👨‍✈️ ${bus.assignedDriver?.name || bus.driverName || bus.driver}`
                    : 'Unassigned'}
                </Text>
              </View>

              <View style={styles.crewCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.crewRole}>ASSIGNED CONDUCTOR</Text>
                  {Boolean(bus.assignedConductor || bus.conductorName || bus.conductor) && (
                    <TouchableOpacity
                      onPress={() => updateBus(bus.id, { conductorId: null })}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 10, color: '#f43f5e', fontWeight: '800' }}>Unassign</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text
                  style={[
                    styles.crewName,
                    {
                      color: (bus.assignedConductor || bus.conductorName || bus.conductor)
                        ? (isLight ? '#047857' : '#00D488')
                        : colors.textMuted,
                      fontWeight: (bus.assignedConductor || bus.conductorName || bus.conductor) ? '800' : '500',
                    },
                  ]}
                >
                  {(bus.assignedConductor?.name || bus.conductorName || bus.conductor)
                    ? `🎫 ${bus.assignedConductor?.name || bus.conductorName || bus.conductor}`
                    : 'Unassigned'}
                </Text>
              </View>
            </View>

            {/* Amenities Pills */}
            {bus.amenities && bus.amenities.length > 0 && (
              <View style={styles.amenitiesRow}>
                {bus.amenities.map((item, idx) => (
                  <View key={idx} style={styles.amenityTag}>
                    <Text style={styles.amenityText}>✓ {item}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 16,
  },
  mobileContainer: {
    padding: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  filterCard: {
    borderRadius: 12,
  },
  searchInput: {
    marginBottom: 8,
  },
  statusPillsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stateCard: {
    borderRadius: 12,
  },
  busListGrid: {
    gap: 12,
  },
  busCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
  busCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  regNumber: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  busModel: {
    fontSize: 13,
    marginTop: 2,
  },
  crewSection: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
    gap: 16,
  },
  crewCol: {
    flex: 1,
  },
  crewRole: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  crewName: {
    fontSize: 12,
    fontWeight: '700',
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  amenityTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  amenityText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
