/**
 * Operator Staff Roster Screen — Bus & Fleet Crew Card Hierarchy
 *
 * Requirements:
 * - Card format where every staff member is grouped directly under their assigned bus card.
 * - Dynamic: Any new bus and staff created automatically renders inside its own dedicated card format.
 * - Driver & Conductor inner cards for each bus with full actions (Reset Password, Edit, Unassign, Status toggle).
 * - Empty slot cards with quick "+ Assign / Provision Driver" or "+ Assign / Provision Conductor" actions.
 * - Standby Crew Pool card for unassigned operational crew ready for fleet assignment.
 * - Search by staff name, phone, or vehicle registration and role filtering.
 */

import React, { useEffect, useState } from 'react';
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
import { StaffMember, FleetBus } from '../../types/operator.types';

export const OperatorStaffScreen: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    staff,
    totalStaff,
    activeDriversCount,
    activeConductorsCount,
    isLoadingStaff,
    staffError,
    fetchStaff,
    buses,
    fetchBuses,
    assignStaffToBus,
    updateStaffStatus,
    setIsAddBusModalOpen,
    setIsAddStaffModalOpen,
    openAddStaffModalWithDefaults,
    setIsEditStaffModalOpen,
    setEditingStaff,
    setIsResetPasswordModalOpen,
    setResetPasswordStaff,
  } = useOperatorStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'FULLY_CREWED' | 'NEEDS_CREW' | 'STANDBY'>('ALL');

  useEffect(() => {
    fetchStaff();
    fetchBuses();
  }, [fetchStaff, fetchBuses]);

  // Non-decommissioned fleet buses
  const activeBuses = buses.filter((b) => b.status !== 'DECOMMISSIONED');

  // Map each bus to its assigned driver and conductor
  const busCrewList = activeBuses.map((bus) => {
    // Find assigned driver
    const driver = staff.find(
      (s) =>
        s.role === 'DRIVER' &&
        (s.busId === bus.id ||
          s.busRegistrationNumber === bus.registrationNumber ||
          bus.driverId === s.id ||
          bus.driverId === s.userId ||
          bus.assignedDriver?.id === s.id ||
          bus.assignedDriver?.userId === s.id ||
          bus.assignedDriver?.name === s.fullName)
    ) || null;

    // Find assigned conductor
    const conductor = staff.find(
      (s) =>
        s.role === 'CONDUCTOR' &&
        (s.busId === bus.id ||
          s.busRegistrationNumber === bus.registrationNumber ||
          bus.conductorId === s.id ||
          bus.conductorId === s.userId ||
          bus.assignedConductor?.id === s.id ||
          bus.assignedConductor?.userId === s.id ||
          bus.assignedConductor?.name === s.fullName)
    ) || null;

    const crewCount = (driver ? 1 : 0) + (conductor ? 1 : 0);

    return {
      bus,
      driver,
      conductor,
      crewCount,
      isFullyCrewed: crewCount === 2,
      needsCrew: crewCount < 2,
    };
  });

  // Identify standby / unassigned staff
  const assignedStaffIds = new Set<string>();
  busCrewList.forEach(({ driver, conductor }) => {
    if (driver) {
      assignedStaffIds.add(driver.id);
      if (driver.userId) assignedStaffIds.add(driver.userId);
    }
    if (conductor) {
      assignedStaffIds.add(conductor.id);
      if (conductor.userId) assignedStaffIds.add(conductor.userId);
    }
  });

  const standbyStaff = staff.filter(
    (s) =>
      !assignedStaffIds.has(s.id) &&
      (!s.userId || !assignedStaffIds.has(s.userId)) &&
      !s.busId &&
      !s.busRegistrationNumber
  );

  // Search filtering
  const q = searchQuery.trim().toLowerCase();

  const filteredBusCrewList = busCrewList.filter(({ bus, driver, conductor, isFullyCrewed, needsCrew }) => {
    // Filter mode
    if (filterMode === 'FULLY_CREWED' && !isFullyCrewed) return false;
    if (filterMode === 'NEEDS_CREW' && !needsCrew) return false;
    if (filterMode === 'STANDBY') return false; // Handled in standby section

    if (!q) return true;

    // Search query matches bus registration or model
    const matchBus =
      bus.registrationNumber?.toLowerCase().includes(q) ||
      bus.model?.toLowerCase().includes(q);

    // Search query matches driver
    const matchDriver =
      driver &&
      (driver.fullName.toLowerCase().includes(q) ||
        driver.phone.includes(q) ||
        (driver.email && driver.email.toLowerCase().includes(q)));

    // Search query matches conductor
    const matchConductor =
      conductor &&
      (conductor.fullName.toLowerCase().includes(q) ||
        conductor.phone.includes(q) ||
        (conductor.email && conductor.email.toLowerCase().includes(q)));

    return matchBus || matchDriver || matchConductor;
  });

  const filteredStandbyStaff = standbyStaff.filter((s) => {
    if (filterMode === 'FULLY_CREWED' || filterMode === 'NEEDS_CREW') return false;
    if (!q) return true;
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  const totalAssignedCrew = staff.length - standbyStaff.length;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, isMobile && styles.mobileContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header & Primary Action Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            Staff Roster & Fleet Crew ({totalStaff})
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
            {activeDriversCount} Drivers • {activeConductorsCount} Conductors • {activeBuses.length} Fleet Vehicles
          </Text>
        </View>

        <View style={styles.headerButtons}>
          <Button
            title="+ Add Bus"
            variant="outline"
            size="sm"
            onPress={() => setIsAddBusModalOpen(true)}
          />
          <Button
            title="+ Provision Staff"
            variant="mint"
            size="sm"
            onPress={() => openAddStaffModalWithDefaults('DRIVER', null)}
          />
        </View>
      </View>

      {/* 2. Top Summary KPI Stats Card */}
      <View style={styles.kpiRow}>
        <Card padding={14} style={[styles.kpiCard, { flex: 1 }]}>
          <Text style={styles.kpiEmoji}>🚌</Text>
          <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{activeBuses.length}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>FLEET BUSES</Text>
        </Card>

        <Card padding={14} style={[styles.kpiCard, { flex: 1 }]}>
          <Text style={styles.kpiEmoji}>👨‍✈️</Text>
          <Text style={[styles.kpiValue, { color: '#38bdf8' }]}>{activeDriversCount}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>ACTIVE DRIVERS</Text>
        </Card>

        <Card padding={14} style={[styles.kpiCard, { flex: 1 }]}>
          <Text style={styles.kpiEmoji}>🎫</Text>
          <Text style={[styles.kpiValue, { color: '#00D488' }]}>{activeConductorsCount}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>CONDUCTORS</Text>
        </Card>

        <Card padding={14} style={[styles.kpiCard, { flex: 1 }]}>
          <Text style={styles.kpiEmoji}>📋</Text>
          <Text style={[styles.kpiValue, { color: standbyStaff.length > 0 ? '#f59e0b' : colors.textPrimary }]}>
            {standbyStaff.length}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>STANDBY POOL</Text>
        </Card>
      </View>

      {/* 3. Search & Quick Filter Controls */}
      <Card padding={12} style={styles.filterCard}>
        <TextInput
          placeholder="Search by staff name, phone, or bus registration (e.g. TEST-01)..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoComplete="off"
          style={styles.searchInput}
        />

        <View style={styles.filterPillsRow}>
          {[
            { id: 'ALL', label: `ALL BUSES & CREW (${busCrewList.length})` },
            { id: 'FULLY_CREWED', label: `FULLY CREWED (${busCrewList.filter((b) => b.isFullyCrewed).length})` },
            { id: 'NEEDS_CREW', label: `NEEDS CREW (${busCrewList.filter((b) => b.needsCrew).length})` },
            { id: 'STANDBY', label: `STANDBY POOL (${standbyStaff.length})` },
          ].map((item) => {
            const isSelected = filterMode === item.id;
            return (
              <TouchableOpacity
                key={item.id}
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
                onPress={() => setFilterMode(item.id as any)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? '#000000' : colors.textPrimary },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* 4. Loading / Error States */}
      {isLoadingStaff && (
        <Card padding={24} style={styles.stateCard}>
          <LoadingIndicator message="Loading vehicle crew cards..." />
        </Card>
      )}

      {staffError && (
        <Card padding={16} style={[styles.stateCard, { borderColor: '#ef4444' }]}>
          <ErrorState
            title="Failed to Load Roster"
            message={staffError}
            retryLabel="Retry"
            onRetry={fetchStaff}
          />
        </Card>
      )}

      {/* 5. Bus & Staff Cards Container (2-Column Grid) */}
      {!isLoadingStaff && (
        <View style={styles.busCardsContainer}>
          {filteredBusCrewList.map(({ bus, driver, conductor, crewCount, isFullyCrewed }) => {
            return (
              <Card
                key={bus.id}
                padding={14}
                style={[
                  styles.busVehicleCard,
                  {
                    width: isMobile ? '100%' : '48.9%',
                    minWidth: isMobile ? '100%' : 340,
                    backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.025)',
                    borderColor: isFullyCrewed
                      ? isLight
                        ? '#00D488'
                        : 'rgba(0, 212, 136, 0.4)'
                      : isLight
                      ? 'rgba(0,0,0,0.08)'
                      : 'rgba(255, 255, 255, 0.08)',
                  },
                ]}
              >
                {/* A. Bus Vehicle Header */}
                <View style={styles.busHeaderRow}>
                  <View style={styles.busInfoBox}>
                    <View style={styles.busTitleRow}>
                      <Text style={styles.busIconText}>🚌</Text>
                      <Text style={[styles.busRegText, { color: colors.textPrimary }]}>
                        {bus.registrationNumber || 'Unassigned Reg'}
                      </Text>
                      <Badge
                        label={bus.status.replace('_', ' ')}
                        variant={bus.status === 'ACTIVE' ? 'mint' : bus.status === 'MAINTENANCE' ? 'warning' : 'info'}
                        size="sm"
                      />
                    </View>
                    <Text style={[styles.busModelText, { color: colors.textSecondary }]}>
                      {bus.model} • {bus.totalSeats} Seats ({bus.seatingType?.replace('_', ' ') || '2x2 Layout'})
                    </Text>
                  </View>

                  <View style={styles.busStatusPillBox}>
                    <View
                      style={[
                        styles.crewCountBadge,
                        {
                          backgroundColor:
                            crewCount === 2
                              ? 'rgba(0, 212, 136, 0.15)'
                              : crewCount === 1
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          borderColor:
                            crewCount === 2
                              ? '#00D488'
                              : crewCount === 1
                              ? '#f59e0b'
                              : '#ef4444',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.crewCountText,
                          {
                            color:
                              crewCount === 2
                                ? '#00D488'
                                : crewCount === 1
                                ? '#f59e0b'
                                : '#ef4444',
                          },
                        ]}
                      >
                        {crewCount === 2
                          ? '✓ Full Crew (2/2)'
                          : crewCount === 1
                          ? '⚠️ 1/2 Crew'
                          : '🚫 0/2 Crew (Unassigned)'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* B. Two Stacked / Compact Slots for Driver & Conductor */}
                <View style={styles.crewSlotsContainer}>
                  {/* Slot 1: DRIVER */}
                  <View style={styles.slotBlock}>
                    <View style={styles.slotHeaderRow}>
                      <Text style={[styles.slotRoleTitle, { color: '#38bdf8' }]}>
                        👨‍✈️ ASSIGNED DRIVER
                      </Text>
                      {driver && (
                        <Badge
                          label={driver.isActive ? 'ACTIVE' : 'SUSPENDED'}
                          variant={driver.isActive ? 'mint' : 'neutral'}
                          size="sm"
                        />
                      )}
                    </View>

                    {driver ? (
                      <View
                        style={[
                          styles.crewCard,
                          {
                            backgroundColor: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.5)',
                            borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                          },
                        ]}
                      >
                        <View style={styles.crewCardContent}>
                          <View style={styles.crewAvatar}>
                            <Text style={{ fontSize: 18 }}>👨‍✈️</Text>
                            <View style={styles.avatarOnlineDot} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.crewName, { color: colors.textPrimary }]}>
                              {driver.fullName}
                            </Text>
                            <Text style={[styles.crewPhone, { color: colors.textSecondary }]}>
                              📞 {driver.phone}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.crewActionsRow}>
                          <TouchableOpacity
                            style={[styles.miniActionBtn, { borderColor: colors.inputBorder }]}
                            onPress={() => {
                              setResetPasswordStaff(driver);
                              setIsResetPasswordModalOpen(true);
                            }}
                          >
                            <Text style={[styles.miniActionText, { color: colors.textPrimary }]}>
                              🔑 Reset
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.miniActionBtn, { borderColor: colors.inputBorder }]}
                            onPress={() => {
                              setEditingStaff(driver);
                              setIsEditStaffModalOpen(true);
                            }}
                          >
                            <Text style={[styles.miniActionText, { color: colors.textPrimary }]}>
                              ✏️ Edit
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.miniActionBtn, { borderColor: '#ef4444' }]}
                            onPress={() => assignStaffToBus(driver.id, null)}
                          >
                            <Text style={[styles.miniActionText, { color: '#ef4444' }]}>
                              ✕ Unassign
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.miniActionBtn, { borderColor: colors.inputBorder }]}
                            onPress={() => updateStaffStatus(driver.id, !driver.isActive)}
                          >
                            <Text
                              style={[
                                styles.miniActionText,
                                { color: driver.isActive ? '#94a3b8' : '#00D488' },
                              ]}
                            >
                              {driver.isActive ? 'Suspend' : 'Activate'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.emptySlotCard,
                          {
                            backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)',
                            borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)',
                          },
                        ]}
                      >
                        <View style={styles.emptySlotLeft}>
                          <Text style={{ fontSize: 18 }}>👨‍✈️</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.emptySlotTitle, { color: colors.textSecondary }]}>
                              No Driver Assigned
                            </Text>
                            <Text style={[styles.emptySlotDesc, { color: colors.textMuted }]}>
                              Required for vehicle dispatch
                            </Text>
                          </View>
                        </View>
                        <Button
                          title="+ Provision Driver"
                          variant="mint"
                          size="sm"
                          onPress={() => openAddStaffModalWithDefaults('DRIVER', bus.id)}
                        />
                      </View>
                    )}
                  </View>

                  {/* Slot 2: CONDUCTOR */}
                  <View style={styles.slotBlock}>
                    <View style={styles.slotHeaderRow}>
                      <Text style={[styles.slotRoleTitle, { color: '#00D488' }]}>
                        🎫 ASSIGNED CONDUCTOR
                      </Text>
                      {conductor && (
                        <Badge
                          label={conductor.isActive ? 'ACTIVE' : 'SUSPENDED'}
                          variant={conductor.isActive ? 'mint' : 'neutral'}
                          size="sm"
                        />
                      )}
                    </View>

                    {conductor ? (
                      <View
                        style={[
                          styles.crewCard,
                          {
                            backgroundColor: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.5)',
                            borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                          },
                        ]}
                      >
                        <View style={styles.crewCardContent}>
                          <View style={styles.crewAvatar}>
                            <Text style={{ fontSize: 18 }}>🎫</Text>
                            <View style={styles.avatarOnlineDot} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.crewName, { color: colors.textPrimary }]}>
                              {conductor.fullName}
                            </Text>
                            <Text style={[styles.crewPhone, { color: colors.textSecondary }]}>
                              📞 {conductor.phone}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.crewActionsRow}>
                          <TouchableOpacity
                            style={[styles.miniActionBtn, { borderColor: colors.inputBorder }]}
                            onPress={() => {
                              setResetPasswordStaff(conductor);
                              setIsResetPasswordModalOpen(true);
                            }}
                          >
                            <Text style={[styles.miniActionText, { color: colors.textPrimary }]}>
                              🔑 Reset
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.miniActionBtn, { borderColor: colors.inputBorder }]}
                            onPress={() => {
                              setEditingStaff(conductor);
                              setIsEditStaffModalOpen(true);
                            }}
                          >
                            <Text style={[styles.miniActionText, { color: colors.textPrimary }]}>
                              ✏️ Edit
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.miniActionBtn, { borderColor: '#ef4444' }]}
                            onPress={() => assignStaffToBus(conductor.id, null)}
                          >
                            <Text style={[styles.miniActionText, { color: '#ef4444' }]}>
                              ✕ Unassign
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.miniActionBtn, { borderColor: colors.inputBorder }]}
                            onPress={() => updateStaffStatus(conductor.id, !conductor.isActive)}
                          >
                            <Text
                              style={[
                                styles.miniActionText,
                                { color: conductor.isActive ? '#94a3b8' : '#00D488' },
                              ]}
                            >
                              {conductor.isActive ? 'Suspend' : 'Activate'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.emptySlotCard,
                          {
                            backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)',
                            borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)',
                          },
                        ]}
                      >
                        <View style={styles.emptySlotLeft}>
                          <Text style={{ fontSize: 18 }}>🎫</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.emptySlotTitle, { color: colors.textSecondary }]}>
                              No Conductor Assigned
                            </Text>
                            <Text style={[styles.emptySlotDesc, { color: colors.textMuted }]}>
                              Required for QR & POS ticketing
                            </Text>
                          </View>
                        </View>
                        <Button
                          title="+ Provision Conductor"
                          variant="mint"
                          size="sm"
                          onPress={() => openAddStaffModalWithDefaults('CONDUCTOR', bus.id)}
                        />
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            );
          })}

          {/* 6. Standby Crew Pool Section (Full Width) */}
          {filteredStandbyStaff.length > 0 && (
            <Card
              padding={16}
              style={[
                styles.standbyPoolCard,
                {
                  backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.025)',
                  borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255, 255, 255, 0.08)',
                },
              ]}
            >
              <View style={styles.standbyHeaderRow}>
                <View>
                  <Text style={[styles.standbyTitle, { color: colors.textPrimary }]}>
                    📋 Standby Crew Pool ({filteredStandbyStaff.length} Unassigned)
                  </Text>
                  <Text style={[styles.standbySubtitle, { color: colors.textSecondary }]}>
                    Available crew members ready for vehicle assignment or emergency driver substitution.
                  </Text>
                </View>
              </View>

              <View style={styles.standbyGrid}>
                {filteredStandbyStaff.map((member) => (
                  <View
                    key={member.id}
                    style={[
                      styles.standbyMemberCard,
                      {
                        backgroundColor: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.5)',
                        borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                      },
                    ]}
                  >
                    <View style={styles.standbyCardContent}>
                      <Text style={{ fontSize: 20 }}>
                        {member.role === 'DRIVER' ? '👨‍✈️' : '🎫'}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Badge
                            label={member.role}
                            variant={member.role === 'DRIVER' ? 'info' : 'mint'}
                            size="sm"
                          />
                          <Badge
                            label={member.isActive ? 'ACTIVE' : 'SUSPENDED'}
                            variant={member.isActive ? 'mint' : 'neutral'}
                            size="sm"
                          />
                        </View>
                        <Text style={[styles.crewName, { color: colors.textPrimary, marginTop: 4 }]}>
                          {member.fullName}
                        </Text>
                        <Text style={[styles.crewPhone, { color: colors.textSecondary }]}>
                          📞 {member.phone}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.crewActionsRow}>
                      <TouchableOpacity
                        style={[styles.miniActionBtn, { backgroundColor: '#00D488', borderColor: '#00D488' }]}
                        onPress={() => {
                          setEditingStaff(member);
                          setIsEditStaffModalOpen(true);
                        }}
                      >
                        <Text style={[styles.miniActionText, { color: '#000000', fontWeight: '800' }]}>
                          🚌 Assign Bus
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.miniActionBtn, { borderColor: colors.inputBorder }]}
                        onPress={() => {
                          setResetPasswordStaff(member);
                          setIsResetPasswordModalOpen(true);
                        }}
                      >
                        <Text style={[styles.miniActionText, { color: colors.textPrimary }]}>
                          🔑 Reset
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.miniActionBtn, { borderColor: colors.inputBorder }]}
                        onPress={() => {
                          setEditingStaff(member);
                          setIsEditStaffModalOpen(true);
                        }}
                      >
                        <Text style={[styles.miniActionText, { color: colors.textPrimary }]}>
                          ✏️ Edit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.miniActionBtn, { borderColor: colors.inputBorder }]}
                        onPress={() => updateStaffStatus(member.id, !member.isActive)}
                      >
                        <Text
                          style={[
                            styles.miniActionText,
                            { color: member.isActive ? '#94a3b8' : '#00D488' },
                          ]}
                        >
                          {member.isActive ? 'Suspend' : 'Activate'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* 7. Empty State when no matching buses or staff */}
          {filteredBusCrewList.length === 0 && filteredStandbyStaff.length === 0 && (
            <Card padding={32} style={[styles.stateCard, { width: '100%' }]}>
              <EmptyState
                title="No Crew Cards Found"
                description={
                  searchQuery || filterMode !== 'ALL'
                    ? 'No fleet vehicles or crew match your current search criteria.'
                    : 'No vehicles or operational crew registered yet. Create your first fleet bus to get started.'
                }
                icon="🚌"
                action={{
                  label: '+ Add Fleet Bus',
                  onPress: () => setIsAddBusModalOpen(true),
                }}
              />
            </Card>
          )}
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
    gap: 10,
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  kpiCard: {
    minWidth: 140,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  filterCard: {
    borderRadius: 12,
  },
  searchInput: {
    marginBottom: 8,
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  busCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'stretch',
  },
  busVehicleCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
    justifyContent: 'space-between',
  },
  busHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 10,
  },
  busInfoBox: {
    flex: 1,
    minWidth: 180,
  },
  busTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  busIconText: {
    fontSize: 18,
  },
  busRegText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  busModelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  busStatusPillBox: {
    alignItems: 'flex-end',
  },
  crewCountBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  crewCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  crewSlotsContainer: {
    gap: 10,
  },
  slotBlock: {
    gap: 5,
  },
  slotHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotRoleTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  crewCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  crewCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  crewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 212, 136, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D488',
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },
  crewName: {
    fontSize: 13,
    fontWeight: '800',
  },
  crewPhone: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  crewActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 6,
  },
  miniActionBtn: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  miniActionText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptySlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
  },
  emptySlotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  emptySlotTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptySlotDesc: {
    fontSize: 10,
    marginTop: 1,
  },
  standbyPoolCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  standbyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 10,
  },
  standbyTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  standbySubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  standbyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  standbyMemberCard: {
    flex: 1,
    minWidth: 260,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  standbyCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
});

