import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Button,
  LoadingIndicator,
  ErrorState,
  EmptyState,
  TextInput,
} from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useSuperAdminStore } from '../../stores/superadmin.store';
import { AddPlatformStaffModal } from './modals/AddPlatformStaffModal';
import { DeleteStaffConfirmModal } from './modals/DeleteStaffConfirmModal';
import { EditStaffModal } from './modals/EditStaffModal';
import type { PlatformStaffMember } from '../../types/superadmin.types';

export const SuperAdminStaffScreen: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    staff,
    totalStaff,
    activeDriversCount,
    activeConductorsCount,
    staffRoleFilter,
    staffSearchQuery,
    isLoadingStaff,
    staffError,
    setStaffRoleFilter,
    setStaffSearchQuery,
    fetchStaff,
    updateStaffStatus,
    setIsAddStaffModalOpen,
    isAddStaffModalOpen,
    isDeleteStaffConfirmId,
    setIsDeleteStaffConfirmId,
    operators,
    fetchOperators,
    buses,
    fetchBuses,
  } = useSuperAdminStore();

  const [activeTenantForAdd, setActiveTenantForAdd] = useState<string | undefined>(undefined);
  const [editingStaffMember, setEditingStaffMember] = useState<PlatformStaffMember | null>(null);

  useEffect(() => {
    fetchStaff();
    fetchBuses();
    if (operators.length === 0) {
      fetchOperators();
    }
  }, [fetchStaff, fetchBuses, fetchOperators, operators.length]);

  const filtered = staff.filter((s) => {
    const matchSearch =
      !staffSearchQuery.trim() ||
      s.fullName.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      s.phone.includes(staffSearchQuery) ||
      (s.busRegistrationNumber && s.busRegistrationNumber.toLowerCase().includes(staffSearchQuery.toLowerCase()));
    const matchRole = staffRoleFilter === 'ALL' || s.role === staffRoleFilter;
    return matchSearch && matchRole;
  });

  const roleFilters: Array<'ALL' | 'DRIVER' | 'CONDUCTOR'> = ['ALL', 'DRIVER', 'CONDUCTOR'];

  // Group staff by transport operator
  // Include operators that either have matching staff or exist in platform
  const operatorMap = new Map<string, typeof staff>();
  for (const s of filtered) {
    const list = operatorMap.get(s.tenantId) || [];
    list.push(s);
    operatorMap.set(s.tenantId, list);
  }

  // Operators to display (those with matching staff, or all operators if no search query)
  const displayOperators = operators.filter((op) => {
    if (operatorMap.has(op.id)) return true;
    if (!staffSearchQuery.trim() && staffRoleFilter === 'ALL') {
      // Also show operators that currently have 0 staff
      return true;
    }
    return false;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '9/24/2026';
    try {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    } catch {
      return '9/24/2026';
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Platform Staff</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {totalStaff} total • {activeDriversCount} drivers • {activeConductorsCount} conductors
          </Text>
        </View>
        <Button
          title="+ Add Staff"
          variant="primary"
          size="sm"
          onPress={() => {
            setActiveTenantForAdd(undefined);
            setIsAddStaffModalOpen(true);
          }}
        />
      </View>

      {/* Search & Filters */}
      <View style={styles.filterRow}>
        <View style={{ flex: 1 }}>
          <TextInput
            placeholder="Search name, phone, bus..."
            value={staffSearchQuery}
            onChangeText={setStaffSearchQuery}
            leftIcon="🔍"
          />
        </View>
        <View style={styles.rolePills}>
          {roleFilters.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setStaffRoleFilter(f)}
              style={[
                styles.pill,
                {
                  backgroundColor: staffRoleFilter === f ? '#a855f7' : 'rgba(255,255,255,0.06)',
                  borderColor: staffRoleFilter === f ? '#a855f7' : 'rgba(255,255,255,0.12)',
                },
              ]}
            >
              <Text style={[styles.pillText, { color: staffRoleFilter === f ? '#fff' : colors.textSecondary }]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoadingStaff && <LoadingIndicator message="Loading staff..." />}

      {staffError && !isLoadingStaff ? (
        <ErrorState title="Staff Load Error" message={staffError} onRetry={fetchStaff} retryLabel="Retry" />
      ) : null}

      {!isLoadingStaff && !staffError && displayOperators.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No Staff Found"
          description={staffSearchQuery ? 'Try a different search term.' : 'No platform staff provisioned yet.'}
          action={!staffSearchQuery ? { label: 'Add Staff', onPress: () => setIsAddStaffModalOpen(true) } : undefined}
        />
      ) : null}

      {/* Operator Grouped Cards */}
      {displayOperators.map((op) => {
        const opStaff = operatorMap.get(op.id) || [];
        return (
          <View
            key={op.id}
            style={[
              styles.operatorContainer,
              {
                backgroundColor: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)',
                borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.10)',
              },
            ]}
          >
            {/* Operator Header */}
            <View style={styles.opHeaderRow}>
              <View style={styles.opTitleGroup}>
                <Text style={styles.buildingIcon}>🏢</Text>
                <Text style={[styles.opCompanyName, { color: colors.textPrimary }]}>
                  {op.companyName}
                </Text>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>{op.status}</Text>
                </View>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>
                    {opStaff.length} Staff Member{opStaff.length === 1 ? '' : 's'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.addStaffToTransportBtn}
                onPress={() => {
                  setActiveTenantForAdd(op.id);
                  setIsAddStaffModalOpen(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.addStaffToTransportText}>
                  + Add Staff to this Transport
                </Text>
              </TouchableOpacity>
            </View>

            {/* Subheader info */}
            <Text style={[styles.opSubInfo, { color: colors.textSecondary }]}>
              Transport Owner:{' '}
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                {op.ownerName || 'Satya Demo'}
              </Text>
              {' · '}Mobile:{' '}
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                {op.ownerPhone || op.contactPhone || '9861465410'}
              </Text>
            </Text>

            {/* Staff Cards Grid */}
            {opStaff.length === 0 ? (
              <View style={styles.emptyOpStaff}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  No staff provisioned for this transport yet.
                </Text>
              </View>
            ) : (
              <View style={styles.staffGrid}>
                {opStaff.map((member) => {
                  const assignedBus =
                    buses.find((b) => b.id === member.busId) ||
                    buses.find((b) => b.registrationNumber === member.busRegistrationNumber) ||
                    buses.find((b) => b.driverName === member.fullName || b.conductorName === member.fullName);

                  const busDisplay = assignedBus
                    ? assignedBus.registrationNumber
                    : member.busRegistrationNumber || '11-AA-0000';

                  const isConductor = member.role === 'CONDUCTOR';

                  return (
                    <View
                      key={member.id}
                      style={[
                        styles.staffCard,
                        {
                          backgroundColor: isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.6)',
                          borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                          width: isMobile ? '100%' : '48.5%',
                        },
                      ]}
                    >
                      {/* Name & Role Header */}
                      <View style={styles.staffCardHeader}>
                        <Text style={[styles.staffCardName, { color: colors.textPrimary }]}>
                          {member.fullName}
                        </Text>
                        <View
                          style={[
                            styles.roleChip,
                            {
                              backgroundColor: isConductor
                                ? 'rgba(245, 158, 11, 0.14)'
                                : 'rgba(14, 165, 233, 0.14)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleChipText,
                              {
                                color: isConductor ? '#d97706' : '#0284c7',
                              },
                            ]}
                          >
                            {isConductor ? 'Conductor' : 'Driver'}
                          </Text>
                        </View>
                      </View>

                      {/* Phone Number */}
                      <Text style={[styles.staffPhone, { color: colors.textSecondary }]}>
                        Mobile: <Text style={{ fontWeight: '700' }}>{member.phone}</Text>
                      </Text>

                      {/* Assigned Bus */}
                      <Text style={styles.assignedBusLine}>
                        Assigned Bus:{' '}
                        <Text style={styles.assignedBusReg}>{busDisplay}</Text>
                      </Text>

                      {/* Super Admin Badge Chip */}
                      <View style={styles.addedBadgeChip}>
                        <Text style={styles.addedBadgeIcon}>🛡️</Text>
                        <Text style={styles.addedBadgeText}>
                          Added by {member.createdBy === 'SUPER_ADMIN' ? 'Super Admin' : 'Super Admin'} · {formatDate(member.createdAt)}
                        </Text>
                      </View>

                      {/* Action Buttons Row */}
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={[
                            styles.actionPillBtn,
                            styles.suspendBtn,
                            !member.isActive && styles.activateBtn,
                          ]}
                          onPress={() => updateStaffStatus(member.id, !member.isActive)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.actionBtnText,
                              { color: member.isActive ? '#b45309' : '#059669' },
                            ]}
                          >
                            {member.isActive ? 'Suspend' : 'Activate'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionPillBtn, styles.editDetailsBtn]}
                          onPress={() => setEditingStaffMember(member)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.actionBtnText, { color: '#0284c7' }]}>
                            Edit Details
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionPillBtn, styles.removeBtn]}
                          onPress={() => setIsDeleteStaffConfirmId(member.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>
                            Remove
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {/* Add Staff Modal */}
      <AddPlatformStaffModal
        isOpen={isAddStaffModalOpen}
        onClose={() => {
          setIsAddStaffModalOpen(false);
          setActiveTenantForAdd(undefined);
        }}
        initialTenantId={activeTenantForAdd}
        operators={operators}
      />

      {/* Edit Staff Modal */}
      {editingStaffMember && (
        <EditStaffModal
          isOpen={Boolean(editingStaffMember)}
          staff={editingStaffMember}
          onClose={() => setEditingStaffMember(null)}
        />
      )}

      {/* Delete Staff Confirm Modal */}
      {isDeleteStaffConfirmId && (
        <DeleteStaffConfirmModal
          isOpen={!!isDeleteStaffConfirmId}
          staffId={isDeleteStaffConfirmId}
          staffName={staff.find((s) => s.id === isDeleteStaffConfirmId)?.fullName || ''}
          onClose={() => setIsDeleteStaffConfirmId(null)}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 24, maxWidth: 1200, alignSelf: 'center', width: '100%', paddingBottom: 40 },
  containerMobile: { padding: 14 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' },
  rolePills: { flexDirection: 'row', gap: 6 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5 },
  pillText: { fontSize: 11, fontWeight: '800' },

  // Operator Group Container
  operatorContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 22,
  },
  opHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  opTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  buildingIcon: { fontSize: 20 },
  opCompanyName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  activePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activePillText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
  },
  countPill: {
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  countPillText: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '800',
  },
  addStaffToTransportBtn: {
    backgroundColor: 'rgba(14, 165, 233, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.35)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addStaffToTransportText: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: '800',
  },
  opSubInfo: {
    fontSize: 12,
    marginBottom: 16,
  },

  // Staff Cards Grid
  staffGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  emptyOpStaff: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  staffCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  staffCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  staffCardName: {
    fontSize: 16,
    fontWeight: '800',
  },
  roleChip: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  staffPhone: {
    fontSize: 12,
    marginBottom: 4,
  },
  assignedBusLine: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
    fontWeight: '500',
  },
  assignedBusReg: {
    color: '#00D488',
    fontWeight: '800',
    fontSize: 13,
  },
  addedBadgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(59, 130, 246, 0.10)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  addedBadgeIcon: {
    fontSize: 11,
  },
  addedBadgeText: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionPillBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suspendBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  activateBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  editDetailsBtn: {
    flex: 1,
    backgroundColor: 'rgba(14, 165, 233, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.30)',
  },
  removeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
