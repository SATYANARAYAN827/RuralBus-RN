import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Modal, Button, Badge } from '../../../components/common';
import { useTheme } from '../../../theme';
import { superAdminService } from '../../../services/superadmin.service';
import type { PlatformOperator, PlatformStaffMember } from '../../../types/superadmin.types';

interface BusDetailItem {
  id: string;
  registrationNumber: string;
  model: string;
  totalSeats: number;
  seatingType?: string;
  status: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  operator: PlatformOperator | null;
}

export const OperatorDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  operator,
}) => {
  const { colors, isLight } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [buses, setBuses] = useState<BusDetailItem[]>([]);
  const [staff, setStaff] = useState<PlatformStaffMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!operator) return;
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedBuses, staffRes] = await Promise.all([
        superAdminService.listOperatorBuses(operator.id),
        superAdminService.listStaff({ tenantId: operator.id }),
      ]);
      setBuses(fetchedBuses);
      setStaff(staffRes.staff);
    } catch (err: any) {
      setError(err?.message || 'Failed to load operator fleet and staff details.');
    } finally {
      setIsLoading(false);
    }
  }, [operator]);

  useEffect(() => {
    if (isOpen && operator) {
      loadDetails();
    } else {
      setBuses([]);
      setStaff([]);
      setError(null);
    }
  }, [isOpen, operator, loadDetails]);

  if (!operator) return null;

  const drivers = staff.filter((s) => s.role === 'DRIVER');
  const conductors = staff.filter((s) => s.role === 'CONDUCTOR');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={operator.companyName}
      subtitle={`Code: ${operator.businessCode} • Corridor: ${operator.corridor || 'State Rural Corridor'}`}
      icon="🏢"
      maxWidth={600}
      actions={
        <Button
          title="Close Details"
          variant="outline"
          size="md"
          onPress={onClose}
        />
      }
    >
      {/* Operator Metadata Banner */}
      <View
        style={[
          styles.metaBanner,
          {
            backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)',
            borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
          },
        ]}
      >
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          Owner: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{operator.ownerName || 'Operator Admin'}</Text>
          {' · '}Mobile: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{operator.ownerPhone || operator.contactPhone || '—'}</Text>
          {' · '}Status: <Text style={{ color: '#00D488', fontWeight: '700' }}>{operator.status}</Text>
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={loadDetails}
            activeOpacity={0.7}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D488" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading assigned buses and staff...
          </Text>
        </View>
      ) : (
        <View style={{ gap: 20 }}>
          {/* SECTION 1: ASSIGNED BUSES */}
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Assigned Fleet Buses ({buses.length})
              </Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                Commercial vehicles allocated to this operator
              </Text>
            </View>

            {buses.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  {
                    backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)',
                    borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.06)',
                  },
                ]}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>🚌</Text>
                <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>
                  No buses currently registered to this operator.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {buses.map((bus) => (
                  <View
                    key={bus.id}
                    style={[
                      styles.cardItem,
                      {
                        backgroundColor: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                        borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.cardTitleRow}>
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                          {bus.registrationNumber}
                        </Text>
                        <Badge variant="success" label={bus.status || 'ACTIVE'} />
                      </View>
                      <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                        {bus.model} • {bus.totalSeats} Passenger Seats
                        {bus.seatingType ? ` • ${bus.seatingType}` : ''}
                      </Text>
                    </View>
                    <View style={styles.corridorPill}>
                      <Text style={styles.corridorPillText}>Corridor Ready</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* SECTION 2: ASSIGNED DRIVERS & CONDUCTORS */}
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Assigned Drivers &amp; Conductors ({staff.length})
              </Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                {drivers.length} Drivers • {conductors.length} Conductors
              </Text>
            </View>

            {staff.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  {
                    backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)',
                    borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.06)',
                  },
                ]}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>👥</Text>
                <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>
                  No drivers or conductors assigned to this operator.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {staff.map((s) => (
                  <View
                    key={s.id}
                    style={[
                      styles.cardItem,
                      {
                        backgroundColor: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                        borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.cardTitleRow}>
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                          {s.fullName}
                        </Text>
                        <Badge
                          variant={s.role === 'DRIVER' ? 'info' : 'warning'}
                          label={s.role}
                        />
                        <Badge
                          variant={s.isActive ? 'success' : 'neutral'}
                          label={s.isActive ? 'ACTIVE' : 'SUSPENDED'}
                        />
                      </View>
                      <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                        Mobile: {s.phone}
                        {s.email ? ` • ${s.email}` : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  metaBanner: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  metaText: { fontSize: 12 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: { color: '#fca5a5', fontSize: 12, flex: 1 },
  retryBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 13 },
  sectionHeaderRow: { marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  sectionSub: { fontSize: 11, marginTop: 2 },
  emptyBox: {
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardItem: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  cardTitle: { fontSize: 14, fontWeight: '800' },
  cardMeta: { fontSize: 12 },
  corridorPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  corridorPillText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },
});
