/**
 * Super Admin Requests Screen
 * Review and approve/reject operator expansion requests, vehicle permits, and licensing submissions.
 *
 * Requirements:
 * - Shows all pending bus registrations (status: 'PENDING_APPROVAL').
 * - Super Admin can click Approve (activates bus & dispatches notification to requesting operator).
 * - Super Admin can click Reject (decommissions bus & dispatches notification to requesting operator).
 * - Real-time dynamic count reflects in header, sidebar badge, and KPI cards.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Card, Badge, EmptyState, TextInput, Button } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useSuperAdminStore } from '../../stores/superadmin.store';
import { useNotificationStore } from '../../stores/notification.store';
import { PlatformBusWithCrew } from '../../types/superadmin.types';

export const SuperAdminRequestsScreen: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    buses,
    operators,
    fetchBuses,
    fetchOperators,
    approveBusRequest,
    rejectBusRequest,
    isLoadingBuses,
  } = useSuperAdminStore();

  const [search, setSearch] = useState('');
  const [processingBusId, setProcessingBusId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchBuses();
    if (operators.length === 0) {
      fetchOperators();
    }
  }, [fetchBuses, fetchOperators, operators.length]);

  // All pending approval buses
  const pendingBuses = buses.filter((b) => b.status === 'PENDING_APPROVAL');

  const filteredRequests = pendingBuses.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchReg = b.registrationNumber.toLowerCase().includes(q);
    const matchModel = b.model.toLowerCase().includes(q);
    const matchOp = b.operatorName.toLowerCase().includes(q);
    return matchReg || matchModel || matchOp;
  });

  const handleApprove = async (bus: PlatformBusWithCrew) => {
    setProcessingBusId(bus.id);
    setActionSuccessMessage(null);
    try {
      const ok = await approveBusRequest(bus.id);
      if (ok) {
        setActionSuccessMessage(
          `✅ Bus "${bus.registrationNumber}" has been approved and activated! Notification dispatched to ${bus.operatorName}.`
        );
        setTimeout(() => setActionSuccessMessage(null), 6000);
      }
    } finally {
      setProcessingBusId(null);
    }
  };

  const handleReject = async (bus: PlatformBusWithCrew) => {
    setProcessingBusId(bus.id);
    setActionSuccessMessage(null);
    try {
      const ok = await rejectBusRequest(bus.id, 'Documentation review pending');
      if (ok) {
        setActionSuccessMessage(
          `⚠️ Bus "${bus.registrationNumber}" was rejected. Notice sent to ${bus.operatorName}.`
        );
        setTimeout(() => setActionSuccessMessage(null), 6000);
      }
    } finally {
      setProcessingBusId(null);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header with dynamic counter */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Operator Bus & Staff Requests ({pendingBuses.length})
            </Text>
            {pendingBuses.length > 0 && (
              <Badge
                label={`${pendingBuses.length} PENDING`}
                variant="warning"
                size="sm"
              />
            )}
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Review operator expansion requests, vehicle permits, and licensing submissions
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => fetchBuses()}
          style={[
            styles.refreshBtn,
            {
              backgroundColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
              borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)',
            },
          ]}
          activeOpacity={0.7}
        >
          <Text style={[styles.refreshBtnText, { color: colors.textPrimary }]}>
            🔄 Refresh
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Success Banner */}
      {actionSuccessMessage && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{actionSuccessMessage}</Text>
        </View>
      )}

      {/* 3. Search Bar if multiple requests */}
      {pendingBuses.length > 1 && (
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search pending requests by vehicle reg, model, or operator name..."
            value={search}
            onChangeText={setSearch}
            leftIcon="🔍"
          />
        </View>
      )}

      {/* 4. Requests List or Empty State */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          icon="📥"
          title="All Operator Requests Cleared"
          description="There are currently zero pending vehicle allocation requests or operator expansion petitions awaiting platform governance review."
        />
      ) : (
        <View style={styles.requestsGrid}>
          {filteredRequests.map((bus) => {
            const op = operators.find(
              (o) => o.id === bus.tenantId || o.companyName === bus.operatorName
            );
            const isProcessing = processingBusId === bus.id;

            return (
              <Card
                key={bus.id}
                padding={20}
                style={[
                  styles.requestCard,
                  {
                    backgroundColor: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
                    borderColor: '#f59e0b',
                  },
                ]}
              >
                {/* Header Tag */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.tagGroup}>
                    <Badge label="BUS PERMIT SUBMISSION" variant="warning" size="sm" />
                    <Badge label="PENDING APPROVAL" variant="warning" size="sm" />
                  </View>
                  <Text style={[styles.timestampText, { color: colors.textMuted }]}>
                    Submitted recently
                  </Text>
                </View>

                {/* Operator and Owner Profile Box */}
                <View
                  style={[
                    styles.operatorProfileBox,
                    {
                      backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                      borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.operatorTitle, { color: colors.textPrimary }]}>
                      🏢 {bus.operatorName || op?.companyName || 'Operator Fleet'}
                    </Text>
                    <View style={styles.operatorMetaRow}>
                      <Text style={[styles.metaItem, { color: colors.textSecondary }]}>
                        👤 Owner:{' '}
                        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                          {op?.ownerName || 'Operator Admin'}
                        </Text>
                      </Text>
                      <Text style={{ color: colors.textMuted }}>•</Text>
                      <Text style={[styles.metaItem, { color: colors.textSecondary }]}>
                        📞 Contact:{' '}
                        <Text style={{ fontWeight: '700', color: '#00D488' }}>
                          {op?.ownerPhone || op?.contactPhone || '9876543999'}
                        </Text>
                      </Text>
                      <Text style={{ color: colors.textMuted }}>•</Text>
                      <Text style={[styles.metaItem, { color: colors.textSecondary }]}>
                        🛣️ Corridor:{' '}
                        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                          {op?.corridor || 'State Rural Corridor'}
                        </Text>
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Vehicle Specifications */}
                <View style={styles.vehicleDetailsBox}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[styles.busRegText, { color: colors.textPrimary }]}>
                        🚌 {bus.registrationNumber}
                      </Text>
                      <Text style={[styles.busModelText, { color: colors.textSecondary }]}>
                        ({bus.model})
                      </Text>
                    </View>

                    <Text style={[styles.specLine, { color: colors.textSecondary }]}>
                      Seating Capacity:{' '}
                      <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                        {bus.totalSeats} Seats ({bus.seatingType?.replace('_', ' ') || '2x2 Layout'})
                      </Text>
                    </Text>

                    <View style={styles.crewLine}>
                      <Text style={[styles.crewText, { color: colors.textMuted }]}>
                        👨‍✈️ Driver: {bus.driverName || 'Unassigned'}
                        {'  •  '}🎫 Conductor: {bus.conductorName || 'Unassigned'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Explanatory Policy Callout */}
                <View
                  style={[
                    styles.policyCallout,
                    {
                      backgroundColor: isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.08)',
                      borderColor: '#00D488',
                    },
                  ]}
                >
                  <Text style={[styles.policyText, { color: isLight ? '#065f46' : '#a7f3d0' }]}>
                    ℹ️ <Text style={{ fontWeight: '700' }}>Platform Policy:</Text> Approving this bus grants state transit authority. An immediate credential-isolated notification will be dispatched to <Text style={{ fontWeight: '700' }}>{op?.ownerName || 'the owner'}</Text> ({op?.ownerPhone || 'registered phone'}).
                  </Text>
                </View>

                {/* Action Buttons Row */}
                <View style={styles.actionsRow}>
                  <Button
                    title="✕ Reject Request"
                    variant="danger"
                    size="sm"
                    disabled={isProcessing}
                    onPress={() => handleReject(bus)}
                  />

                  <View style={{ flex: 1 }} />

                  <Button
                    title={isProcessing ? 'Activating...' : '✓ Approve & Activate Bus'}
                    variant="mint"
                    size="md"
                    isLoading={isProcessing}
                    disabled={isProcessing}
                    onPress={() => handleApprove(bus)}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 24, maxWidth: 1100, alignSelf: 'center', width: '100%' },
  containerMobile: { padding: 14 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 4 },
  refreshBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBox: {
    marginBottom: 16,
  },
  requestsGrid: {
    gap: 16,
  },
  requestCard: {
    borderRadius: 14,
    borderWidth: 1.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  tagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestampText: {
    fontSize: 12,
    fontWeight: '600',
  },
  operatorProfileBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  operatorTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  operatorMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    fontSize: 12,
  },
  vehicleDetailsBox: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  busRegText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  busModelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  specLine: {
    fontSize: 12,
    marginTop: 4,
  },
  crewLine: {
    marginTop: 4,
  },
  crewText: {
    fontSize: 12,
  },
  policyCallout: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  policyText: {
    fontSize: 12,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
