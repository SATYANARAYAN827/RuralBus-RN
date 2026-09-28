import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { TextInput, EmptyState } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useSuperAdminStore } from '../../stores/superadmin.store';
import { superAdminService } from '../../services/superadmin.service';
import { RegisterBusModal } from './modals/RegisterBusModal';
import { EditBusModal } from './modals/EditBusModal';
import { DeleteOperatorConfirmModal } from './modals/DeleteOperatorConfirmModal';

interface BusItem {
  id: string;
  reg: string;
  model: string;
  seats: number;
  operator: string;
  tenantId: string;
  status: 'ACTIVE' | 'IN_TRANSIT' | 'MAINTENANCE';
  driver?: string;
  conductor?: string;
  createdAt?: string;
}

const PLATFORM_BUSES_SEED: BusItem[] = [
  { id: 'bus-1', reg: 'KA-TEST-4741', model: 'KA-TEST-4741', seats: 32, operator: 'Belagavi Lines', tenantId: 'e1282381-a731-4fd0-804f-ea865cdd7d45', status: 'ACTIVE', driver: undefined, conductor: undefined, createdAt: '2026-09-27' },
  { id: 'bus-2', reg: 'KA-22-C-9224', model: 'KA-22-C-9224', seats: 30, operator: 'Belagavi Lines', tenantId: 'e1282381-a731-4fd0-804f-ea865cdd7d45', status: 'ACTIVE', driver: undefined, conductor: undefined, createdAt: '2026-09-24' },
  { id: 'bus-3', reg: '11-AA-0000', model: 'Tata Starbus Ultra 40S', seats: 36, operator: 'Demo Travel', tenantId: '1cd2e144-0976-42fa-9d52-4380c1f9b1c3', status: 'ACTIVE', driver: 'Demo Driver', conductor: 'Demo Conductor', createdAt: '2026-09-24' },
  { id: 'bus-4', reg: 'KA-13-P-1114', model: 'Eicher Skyline', seats: 28, operator: 'Hassan Coastal Express', tenantId: '418f8a45-fe36-4c4d-ac77-dcc77f912f63', status: 'ACTIVE', driver: 'Driver Payment', conductor: undefined, createdAt: '2026-09-24' },
  { id: 'bus-5', reg: 'KA-09-BK-9244', model: 'Tata Starbus 30', seats: 34, operator: 'Karnataka State Express', tenantId: '4c452dd3-5eb5-4e38-a194-275261cca42d', status: 'ACTIVE', driver: 'Driver SEAT', conductor: undefined, createdAt: '2026-09-24' },
  { id: 'bus-6', reg: 'KA-09-F-2198', model: 'Ashok Leyland Viking', seats: 32, operator: 'Karnataka State Rural Transport Corp', tenantId: 'a337a58e-a5e3-4c5e-b4a2-0ec68671b126', status: 'ACTIVE', driver: 'Driver Basavaraj', conductor: 'Conductor Ningappa', createdAt: '2026-09-24' },
  { id: 'bus-7', reg: 'KA-55-D-4348', model: 'Ashok Leyland Viking', seats: 30, operator: 'Kaveri Rural Transport', tenantId: '7cc12e32-64d0-4d4b-a6b3-dc7b019ddb20', status: 'ACTIVE', driver: 'Driver Kaveri', conductor: undefined, createdAt: '2026-09-24' },
  { id: 'bus-8', reg: 'KA-20-U-9685', model: 'Volvo 9400', seats: 45, operator: 'Udupi Coastal Lines', tenantId: 'aa033919-753a-46f2-9ecc-0bf65639f898', status: 'ACTIVE', driver: undefined, conductor: undefined, createdAt: '2026-09-24' },
];

export const SuperAdminBusesScreen: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    operators,
    fetchOperators,
    updateOperator,
    approveBusRequest,
    isRegisterBusModalOpen,
    setIsRegisterBusModalOpen,
    isDeleteOperatorConfirmId,
    setIsDeleteOperatorConfirmId,
  } = useSuperAdminStore();

  const [search, setSearch] = useState('');
  const [buses, setBuses] = useState<BusItem[]>(PLATFORM_BUSES_SEED);
  const [selectedTenantForBus, setSelectedTenantForBus] = useState<string | undefined>(undefined);
  const [editingBus, setEditingBus] = useState<BusItem | null>(null);

  const loadAllBuses = useCallback(async () => {
    try {
      if (operators.length === 0) {
        await fetchOperators();
      }
      const currentOps = useSuperAdminStore.getState().operators;
      const crewBuses = await superAdminService.listAllBusesWithCrew(currentOps);

      if (crewBuses.length > 0) {
        const map = new Map<string, BusItem>();
        for (const b of crewBuses) {
          map.set(b.registrationNumber, {
            id: b.id,
            reg: b.registrationNumber,
            model: b.model,
            seats: b.totalSeats,
            operator: b.operatorName,
            tenantId: b.tenantId,
            status: (b.status as any) || 'ACTIVE',
            driver: b.driverName,
            conductor: b.conductorName,
          });
        }
        for (const b of PLATFORM_BUSES_SEED) {
          if (!map.has(b.reg)) {
            map.set(b.reg, b);
          }
        }
        setBuses(Array.from(map.values()));
      }
    } catch {
      // Keep existing buses
    }
  }, [operators.length, fetchOperators]);

  useEffect(() => {
    loadAllBuses();
  }, [loadAllBuses]);

  const filtered = buses.filter(
    (b) =>
      b.reg.toLowerCase().includes(search.toLowerCase()) ||
      b.operator.toLowerCase().includes(search.toLowerCase()) ||
      b.model.toLowerCase().includes(search.toLowerCase()) ||
      (b.driver && b.driver.toLowerCase().includes(search.toLowerCase())) ||
      (b.conductor && b.conductor.toLowerCase().includes(search.toLowerCase()))
  );

  // Group buses by operator
  const busesByTenant = new Map<string, BusItem[]>();
  for (const b of filtered) {
    const list = busesByTenant.get(b.tenantId) || [];
    list.push(b);
    busesByTenant.set(b.tenantId, list);
  }

  // Operators to display (those with matching buses or all operators if no search)
  const displayOperators = operators.filter((op) => {
    if (busesByTenant.has(op.id)) return true;
    if (!search.trim()) return true;
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

  const handleToggleBusStatus = async (busId: string, currentStatus: string) => {
    if (currentStatus === 'PENDING_APPROVAL') {
      await approveBusRequest(busId);
      await loadAllBuses();
      return;
    }
    const nextStatus = currentStatus === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
    try {
      await superAdminService.updateBusStatus(busId, nextStatus);
    } catch {}
    setBuses((prev) =>
      prev.map((b) => {
        if (b.id === busId) {
          return {
            ...b,
            status: nextStatus,
          };
        }
        return b;
      })
    );
  };

  const handleDeleteBus = (busId: string) => {
    setBuses((prev) => prev.filter((b) => b.id !== busId));
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Fleet Buses ({buses.length})
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Platform-wide commercial bus oversight, registration, and operator allocations
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addTopBtn}
          activeOpacity={0.8}
          onPress={() => {
            setSelectedTenantForBus(undefined);
            setIsRegisterBusModalOpen(true);
          }}
        >
          <Text style={styles.addTopBtnText}>+ Register Bus to Owner</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={{ marginBottom: 20 }}>
        <TextInput
          placeholder="Search registration, operator, model, driver..."
          value={search}
          onChangeText={setSearch}
          leftIcon="🔍"
        />
      </View>

      {displayOperators.length === 0 ? (
        <EmptyState
          icon="🚌"
          title="No Buses Found"
          description="Try a different search query or register a new bus to an operator."
        />
      ) : null}

      {/* Operator Grouped Cards */}
      {displayOperators.map((op) => {
        const opBuses = busesByTenant.get(op.id) || [];
        const isOperatorActive = op.status === 'ACTIVE';

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
                <View
                  style={[
                    styles.activePill,
                    !isOperatorActive && styles.suspendedPill,
                  ]}
                >
                  <Text
                    style={[
                      styles.activePillText,
                      !isOperatorActive && styles.suspendedPillText,
                    ]}
                  >
                    {op.status}
                  </Text>
                </View>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>
                    {opBuses.length} Bus{opBuses.length === 1 ? '' : 'es'}
                  </Text>
                </View>
              </View>

              {/* Right Action Buttons */}
              <View style={styles.opActionsGroup}>
                <TouchableOpacity
                  style={[
                    styles.opHeaderBtn,
                    styles.deactivateOpBtn,
                  ]}
                  onPress={() =>
                    updateOperator(op.id, {
                      status: isOperatorActive ? 'SUSPENDED' : 'ACTIVE',
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.deactivateOpText}>
                    {isOperatorActive ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.opHeaderBtn, styles.deleteOpBtn]}
                  onPress={() => setIsDeleteOperatorConfirmId(op.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteOpText}>Delete Operator</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.opHeaderBtn, styles.registerBusBtn]}
                  onPress={() => {
                    setSelectedTenantForBus(op.id);
                    setIsRegisterBusModalOpen(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.registerBusText}>+ Register Bus</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Subheader line */}
            <Text style={[styles.opSubInfo, { color: colors.textSecondary }]}>
              Owner:{' '}
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                {op.ownerName || 'Operator Admin'}
              </Text>
              {' · '}Mobile:{' '}
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                {op.ownerPhone || op.contactPhone || '9876543301'}
              </Text>
              {' · '}Corridor:{' '}
              <Text style={{ color: '#00D488', fontWeight: '700' }}>
                {op.corridor || 'State Rural Corridor'}
              </Text>
            </Text>

            {/* Bus Cards Grid */}
            {opBuses.length === 0 ? (
              <View style={styles.emptyOpBuses}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  No commercial buses registered under this operator yet.
                </Text>
              </View>
            ) : (
              <View style={styles.busesGrid}>
                {opBuses.map((bus) => {
                  const isBusActive = bus.status === 'ACTIVE';

                  return (
                    <View
                      key={bus.id}
                      style={[
                        styles.busCard,
                        {
                          backgroundColor: isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.6)',
                          borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                          width: isMobile ? '100%' : '48.5%',
                        },
                      ]}
                    >
                      {/* Registration & Status Header */}
                      <View style={styles.busCardHeader}>
                        <Text style={styles.busCardReg}>{bus.reg}</Text>
                        <View style={styles.busStatusPill}>
                          <Text style={styles.busStatusPillText}>{bus.status}</Text>
                        </View>
                      </View>

                      {/* Bus Model Name */}
                      <Text style={[styles.busModelName, { color: colors.textPrimary }]}>
                        {bus.model}
                      </Text>

                      {/* Route Line */}
                      <Text style={[styles.busRouteLine, { color: colors.textSecondary }]}>
                        Route:{' '}
                        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                          Assigned Corridor Route ({bus.seats} Seats)
                        </Text>
                      </Text>

                      {/* Crew Assignment Line */}
                      <View style={styles.busCrewLine}>
                        <Text style={[styles.crewLabel, { color: colors.textSecondary }]}>
                          Driver:{' '}
                          <Text
                            style={{
                              color: bus.driver ? '#38bdf8' : '#f59e0b',
                              fontWeight: '700',
                            }}
                          >
                            {bus.driver || 'Unassigned'}
                          </Text>
                        </Text>
                        <Text style={{ color: colors.textMuted, marginHorizontal: 6 }}>·</Text>
                        <Text style={[styles.crewLabel, { color: colors.textSecondary }]}>
                          Conductor:{' '}
                          <Text
                            style={{
                              color: bus.conductor ? '#34d399' : '#f59e0b',
                              fontWeight: '700',
                            }}
                          >
                            {bus.conductor || 'Unassigned'}
                          </Text>
                        </Text>
                      </View>

                      {/* Super Admin Badge Chip */}
                      <View style={styles.addedBadgeChip}>
                        <Text style={styles.addedBadgeIcon}>🛡️</Text>
                        <Text style={styles.addedBadgeText}>
                          Added by Super Admin · {formatDate(bus.createdAt)}
                        </Text>
                      </View>

                      {/* Action Buttons Row */}
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.editBusBtn]}
                          onPress={() => setEditingBus(bus)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.editBusText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deactivateBusBtn]}
                          onPress={() => handleToggleBusStatus(bus.id, bus.status)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.deactivateBusText}>
                            {isBusActive ? 'Deactivate' : 'Activate'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteBusBtn]}
                          onPress={() => handleDeleteBus(bus.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.deleteBusText}>Delete</Text>
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

      {/* Register Bus Modal */}
      <RegisterBusModal
        isOpen={isRegisterBusModalOpen}
        onClose={() => {
          setIsRegisterBusModalOpen(false);
          setSelectedTenantForBus(undefined);
        }}
        initialTenantId={selectedTenantForBus}
        onSuccess={() => {
          loadAllBuses();
        }}
      />

      {/* Edit Bus Modal */}
      {editingBus && (
        <EditBusModal
          isOpen={Boolean(editingBus)}
          bus={editingBus}
          onClose={() => setEditingBus(null)}
          onSave={(updated) => {
            setBuses((prev) =>
              prev.map((b) => (b.id === editingBus.id ? { ...b, ...updated, status: updated.status as any } : b))
            );
          }}
        />
      )}

      {/* Delete Operator Confirm Modal */}
      {isDeleteOperatorConfirmId && (
        <DeleteOperatorConfirmModal
          isOpen={Boolean(isDeleteOperatorConfirmId)}
          tenantId={isDeleteOperatorConfirmId}
          operatorName={
            operators.find((o) => o.id === isDeleteOperatorConfirmId)?.companyName || 'Operator'
          }
          onClose={() => setIsDeleteOperatorConfirmId(null)}
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
  addTopBtn: {
    backgroundColor: '#00D488',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  addTopBtnText: {
    color: '#020617',
    fontWeight: '800',
    fontSize: 13,
  },

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
  suspendedPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  suspendedPillText: {
    color: '#ef4444',
  },
  countPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  countPillText: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '800',
  },
  opActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  opHeaderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deactivateOpBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  deactivateOpText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '800',
  },
  deleteOpBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
  },
  deleteOpText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '800',
  },
  registerBusBtn: {
    backgroundColor: 'rgba(0, 212, 136, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 136, 0.35)',
  },
  registerBusText: {
    color: '#00D488',
    fontSize: 12,
    fontWeight: '800',
  },
  opSubInfo: {
    fontSize: 12,
    marginBottom: 16,
  },

  // Bus Cards Grid
  busesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  emptyOpBuses: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  busCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  busCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  busCardReg: {
    color: '#00D488',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  busStatusPill: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  busStatusPillText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
  },
  busModelName: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  busRouteLine: {
    fontSize: 12,
    marginBottom: 4,
  },
  busCrewLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  crewLabel: {
    fontSize: 11,
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
  actionBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBusBtn: {
    backgroundColor: 'rgba(0, 212, 136, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 136, 0.35)',
  },
  editBusText: {
    color: '#00D488',
    fontSize: 12,
    fontWeight: '800',
  },
  deactivateBusBtn: {
    flex: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  deactivateBusText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '800',
  },
  deleteBusBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
  },
  deleteBusText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '800',
  },
});
