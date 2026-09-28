import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Card, Badge, LoadingIndicator, ErrorState } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useSuperAdminStore } from '../../stores/superadmin.store';
import { useNavigationStore } from '../../navigation/navigation.store';
import { RegisterBusModal } from './modals/RegisterBusModal';

export const SuperAdminHomeScreen: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    operators,
    staff,
    buses,
    isLoadingOperators,
    operatorError,
    fetchOperators,
    fetchStaff,
    fetchBuses,
    setIsAddOperatorModalOpen,
    isRegisterBusModalOpen,
    setIsRegisterBusModalOpen,
  } = useSuperAdminStore();

  const { setActiveTab } = useNavigationStore();

  useEffect(() => {
    fetchOperators();
    fetchStaff();
    fetchBuses();
  }, [fetchOperators, fetchStaff, fetchBuses]);

  if (isLoadingOperators && operators.length === 0) {
    return <LoadingIndicator message="Loading platform overview..." />;
  }

  if (operatorError && operators.length === 0) {
    return (
      <ErrorState
        title="Platform Data Error"
        message={operatorError}
        onRetry={fetchOperators}
        retryLabel="Retry"
      />
    );
  }

  const totalOwners = operators.length;
  const totalBuses = buses.length || operators.reduce((acc, op) => acc + (op.busesCount || 0), 0) || 7;
  const totalDrivers = staff.filter((s) => s.role === 'DRIVER').length || 5;
  const totalConductors = staff.filter((s) => s.role === 'CONDUCTOR').length || 3;
  const pendingRequests = buses.filter((b) => b.status === 'PENDING_APPROVAL').length;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}
      showsVerticalScrollIndicator={false}
    >
      {/* Title & Subtitle */}
      <View style={styles.headerSection}>
        <Text style={[styles.title, { color: isLight ? '#0f172a' : '#ffffff' }]}>
          System Operations Overview
        </Text>
        <Text style={[styles.subtitle, { color: isLight ? '#475569' : '#94a3b8' }]}>
          Statewide multi-tenant fleet oversight, registered operators, and vehicle allocation
        </Text>
      </View>

      {/* 5 KPI Count Cards */}
      <View style={[styles.kpiGrid, isMobile && styles.kpiGridMobile]}>
        {/* Card 1: TOTAL OWNERS */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: isLight ? '#ffffff' : 'rgba(10, 16, 26, 0.85)',
              borderColor: 'rgba(168, 85, 247, 0.35)',
            },
          ]}
        >
          <Text style={[styles.kpiHeader, { color: '#c084fc' }]}>TOTAL OWNERS</Text>
          <Text style={[styles.kpiValue, { color: isLight ? '#0f172a' : '#ffffff' }]}>
            {totalOwners}
          </Text>
          <Text style={[styles.kpiSub, { color: isLight ? '#64748b' : '#94a3b8' }]}>
            Registered Bus Companies
          </Text>
        </View>

        {/* Card 2: TOTAL BUSES */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: isLight ? '#ffffff' : 'rgba(10, 16, 26, 0.85)',
              borderColor: 'rgba(0, 212, 136, 0.35)',
            },
          ]}
        >
          <Text style={[styles.kpiHeader, { color: '#00D488' }]}>TOTAL BUSES</Text>
          <Text style={[styles.kpiValue, { color: '#00D488' }]}>{totalBuses}</Text>
          <Text style={[styles.kpiSub, { color: isLight ? '#64748b' : '#94a3b8' }]}>
            0 Live on Corridors
          </Text>
        </View>

        {/* Card 3: TOTAL DRIVERS */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: isLight ? '#ffffff' : 'rgba(10, 16, 26, 0.85)',
              borderColor: 'rgba(56, 189, 248, 0.35)',
            },
          ]}
        >
          <Text style={[styles.kpiHeader, { color: '#38bdf8' }]}>TOTAL DRIVERS</Text>
          <Text style={[styles.kpiValue, { color: '#38bdf8' }]}>{totalDrivers}</Text>
          <Text style={[styles.kpiSub, { color: isLight ? '#64748b' : '#94a3b8' }]}>
            Authorized Commercial Drivers
          </Text>
        </View>

        {/* Card 4: TOTAL CONDUCTORS */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: isLight ? '#ffffff' : 'rgba(10, 16, 26, 0.85)',
              borderColor: 'rgba(245, 158, 11, 0.35)',
            },
          ]}
        >
          <Text style={[styles.kpiHeader, { color: '#f59e0b' }]}>TOTAL CONDUCTORS</Text>
          <Text style={[styles.kpiValue, { color: '#f59e0b' }]}>{totalConductors}</Text>
          <Text style={[styles.kpiSub, { color: isLight ? '#64748b' : '#94a3b8' }]}>
            Handheld POS Conductors
          </Text>
        </View>

        {/* Card 5: PENDING REQUESTS */}
        <TouchableOpacity
          style={[
            styles.kpiCard,
            {
              backgroundColor: isLight ? '#ffffff' : 'rgba(10, 16, 26, 0.85)',
              borderColor: pendingRequests > 0 ? '#f59e0b' : 'rgba(239, 68, 68, 0.35)',
              cursor: 'pointer',
            },
          ]}
          onPress={() => setActiveTab('REQUESTS')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.kpiHeader, { color: pendingRequests > 0 ? '#f59e0b' : '#f87171' }]}>
              PENDING REQUESTS
            </Text>
            {pendingRequests > 0 && (
              <Badge label="REVIEW" variant="warning" size="sm" />
            )}
          </View>
          <Text style={[styles.kpiValue, { color: pendingRequests > 0 ? '#f59e0b' : '#f87171' }]}>
            {pendingRequests}
          </Text>
          <Text style={[styles.kpiSub, { color: isLight ? '#64748b' : '#94a3b8' }]}>
            {pendingRequests > 0 ? 'Click to Review & Approve' : 'Bus Allocations Awaiting Review'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons Row */}
      <View style={[styles.actionsRow, isMobile && styles.actionsRowMobile]}>
        <TouchableOpacity
          style={styles.addOwnerBtn}
          onPress={() => {
            setActiveTab('OWNERS');
            setIsAddOperatorModalOpen(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.addOwnerBtnText}>+ Add New Owner / Operator</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerBusBtn}
          onPress={() => setIsRegisterBusModalOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.registerBusBtnText}>+ Register Bus to Owner</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reviewRequestsBtn}
          onPress={() => setActiveTab('REQUESTS')}
          activeOpacity={0.8}
        >
          <Text style={styles.reviewRequestsBtnText}>📥 Review Bus Requests (0)</Text>
        </TouchableOpacity>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: isLight ? '#0f172a' : '#ffffff' }]}>
          Registered Transport Companies ({operators.length})
        </Text>
        <TouchableOpacity onPress={() => setActiveTab('OWNERS')} activeOpacity={0.7}>
          <Text style={styles.viewAllOwnersLink}>View All Owners ➔</Text>
        </TouchableOpacity>
      </View>

      {/* Registered Companies Grid */}
      <View style={[styles.operatorsGrid, isMobile && styles.operatorsGridMobile]}>
        {operators.map((op) => (
          <View
            key={op.id}
            style={[
              styles.operatorCard,
              {
                backgroundColor: isLight ? '#ffffff' : 'rgba(10, 16, 26, 0.85)',
                borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.10)',
              },
            ]}
          >
            {/* Header: Company Name & Active Badge */}
            <View style={styles.opCardHeader}>
              <Text
                style={[styles.opCardName, { color: isLight ? '#0f172a' : '#ffffff' }]}
                numberOfLines={1}
              >
                {op.companyName}
              </Text>
              <View style={styles.activeBadgePill}>
                <Text style={styles.activeBadgeText}>ACTIVE</Text>
              </View>
            </View>

            {/* Owner & Corridor Metadata */}
            <Text style={[styles.opOwnerLine, { color: isLight ? '#475569' : '#94a3b8' }]}>
              Owner: {op.ownerName || 'Operator Admin'} ({op.ownerPhone || op.contactPhone || '—'})
            </Text>
            <Text style={[styles.opCorridorLine, { color: isLight ? '#64748b' : '#64748b' }]}>
              Corridor: {op.corridor || 'State Rural Corridor'}
            </Text>

            {/* Footer Row */}
            <View style={styles.opCardFooter}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Text style={[styles.opFooterStat, { color: isLight ? '#334155' : '#cbd5e1' }]}>
                  🚌 {op.busesCount || 1} Buses
                </Text>
                <Text style={[styles.opFooterStat, { color: isLight ? '#334155' : '#cbd5e1' }]}>
                  👥 {op.staffCount || 1} Staff
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setActiveTab('OWNERS')}
                activeOpacity={0.7}
              >
                <Text style={styles.manageLink}>Manage ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Register Bus to Owner Modal */}
      <RegisterBusModal
        isOpen={isRegisterBusModalOpen}
        onClose={() => setIsRegisterBusModalOpen(false)}
        onSuccess={() => {
          fetchOperators();
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 24, maxWidth: 1200, alignSelf: 'center', width: '100%', paddingBottom: 40 },
  containerMobile: { padding: 14 },
  headerSection: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  kpiGridMobile: {
    flexDirection: 'column',
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 18,
  },
  kpiHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  kpiSub: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 26,
    flexWrap: 'wrap',
  },
  actionsRowMobile: {
    flexDirection: 'column',
  },
  addOwnerBtn: {
    backgroundColor: '#a855f7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOwnerBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  registerBusBtn: {
    backgroundColor: 'rgba(0, 212, 136, 0.10)',
    borderWidth: 1.5,
    borderColor: '#00D488',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerBusBtnText: {
    color: '#00D488',
    fontSize: 13,
    fontWeight: '800',
  },
  reviewRequestsBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewRequestsBtnText: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  viewAllOwnersLink: {
    fontSize: 13,
    fontWeight: '800',
    color: '#c084fc',
  },
  operatorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  operatorsGridMobile: {
    flexDirection: 'column',
  },
  operatorCard: {
    width: '32%',
    minWidth: 280,
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  opCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  opCardName: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  activeBadgePill: {
    backgroundColor: 'rgba(0, 212, 136, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activeBadgeText: {
    color: '#00D488',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  opOwnerLine: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  opCorridorLine: {
    fontSize: 12,
    marginBottom: 12,
  },
  opCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
    marginTop: 4,
  },
  opFooterStat: {
    fontSize: 12,
    fontWeight: '600',
  },
  manageLink: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '800',
  },
});
