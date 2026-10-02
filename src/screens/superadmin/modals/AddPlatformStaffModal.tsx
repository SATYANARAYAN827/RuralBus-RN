import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Modal, Button, TextInput, Badge } from '../../../components/common';
import { useTheme } from '../../../theme';
import { useSuperAdminStore } from '../../../stores/superadmin.store';
import type { PlatformOperator, PlatformBusWithCrew } from '../../../types/superadmin.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  operators?: PlatformOperator[];
  buses?: PlatformBusWithCrew[];
  initialTenantId?: string;
}

export const AddPlatformStaffModal: React.FC<Props> = ({ isOpen, onClose, initialTenantId }) => {
  const { colors, isLight } = useTheme();
  const {
    createStaff,
    isLoadingStaff,
    staffError,
    buses: storeBuses,
    fetchBuses,
    isLoadingBuses,
  } = useSuperAdminStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'DRIVER' | 'CONDUCTOR'>('DRIVER');
  const [password, setPassword] = useState('');
  const [selectedBusId, setSelectedBusId] = useState('');
  const [busSearch, setBusSearch] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const reset = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setRole('DRIVER');
    setPassword('');
    setSelectedBusId('');
    setBusSearch('');
    setValidationError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      fetchBuses();
      if (initialTenantId) {
        const tenantBus = storeBuses.find((b) => b.tenantId === initialTenantId);
        if (tenantBus) {
          setSelectedBusId(tenantBus.id);
        }
      }
    }
  }, [isOpen, initialTenantId]);

  const selectedBus = storeBuses.find((b) => b.id === selectedBusId);

  const filteredBuses = storeBuses.filter((b) => {
    if (!busSearch.trim()) return true;
    const q = busSearch.toLowerCase();
    return (
      b.registrationNumber.toLowerCase().includes(q) ||
      b.model.toLowerCase().includes(q) ||
      b.operatorName.toLowerCase().includes(q) ||
      (b.driverName && b.driverName.toLowerCase().includes(q)) ||
      (b.conductorName && b.conductorName.toLowerCase().includes(q))
    );
  });

  const handleSubmit = async () => {
    setValidationError(null);
    if (!selectedBus) {
      setValidationError('Please select the target bus for this staff member.');
      return;
    }
    if (!fullName.trim() || fullName.trim().length < 2) {
      setValidationError('Full name must be at least 2 characters.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setValidationError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }

    const ok = await createStaff({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      role,
      password,
      tenantId: selectedBus.tenantId,
      busId: selectedBus.id,
      bus: selectedBus.registrationNumber,
    });

    if (ok) {
      reset();
      onClose();
    }
  };

  const error = validationError || staffError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Provision Staff Member"
      subtitle="Assign a driver or conductor to a bus"
      icon="👥"
      actions={
        <>
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            onPress={() => {
              reset();
              onClose();
            }}
          />
          <Button
            title={isLoadingStaff ? 'Creating...' : 'Create Staff'}
            variant="primary"
            size="md"
            onPress={handleSubmit}
            isLoading={isLoadingStaff}
          />
        </>
      }
    >
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {/* Target Bus Search & Selection */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          ASSIGN TO BUS & CREW *
        </Text>

        {selectedBus ? (
          <View
            style={[
              styles.selectedBusCard,
              {
                backgroundColor: isLight ? 'rgba(0, 212, 136, 0.08)' : 'rgba(0, 212, 136, 0.12)',
                borderColor: '#00D488',
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.selectedRow}>
                <Text style={styles.busEmoji}>🚌</Text>
                <Text style={[styles.selectedTitle, { color: colors.textPrimary }]}>
                  {selectedBus.model} ({selectedBus.registrationNumber})
                </Text>
              </View>

              <View style={styles.crewRow}>
                <View style={styles.crewBadge}>
                  <Text style={styles.crewLabel}>Driver:</Text>
                  <Text style={[styles.crewValue, { color: selectedBus.driverName ? '#38bdf8' : colors.textMuted }]}>
                    {selectedBus.driverName || 'None (Unassigned)'}
                  </Text>
                </View>
                <Text style={{ color: colors.textMuted }}>•</Text>
                <View style={styles.crewBadge}>
                  <Text style={styles.crewLabel}>Conductor:</Text>
                  <Text style={[styles.crewValue, { color: selectedBus.conductorName ? '#34d399' : colors.textMuted }]}>
                    {selectedBus.conductorName || 'None (Unassigned)'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.selectedSub, { color: colors.textMuted }]}>
                Operator: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{selectedBus.operatorName}</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.changeBtn}
              onPress={() => {
                setSelectedBusId('');
                setBusSearch('');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TextInput
              placeholder="Search bus name, registration, or operator..."
              value={busSearch}
              onChangeText={setBusSearch}
              leftIcon="🔍"
            />

            <View
              style={[
                styles.dropdownContainer,
                {
                  borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.10)',
                  backgroundColor: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.6)',
                },
              ]}
            >
              {isLoadingBuses && storeBuses.length === 0 ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color="#a855f7" />
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 8 }}>
                    Loading fleet buses...
                  </Text>
                </View>
              ) : filteredBuses.length === 0 ? (
                <View style={styles.emptyResults}>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    No buses found matching &quot;{busSearch}&quot;
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={{ maxHeight: 200 }}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >
                  {filteredBuses.map((bus) => (
                    <TouchableOpacity
                      key={bus.id}
                      style={[
                        styles.dropdownItem,
                        {
                          borderBottomColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
                        },
                      ]}
                      onPress={() => {
                        setSelectedBusId(bus.id);
                        setBusSearch('');
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        {/* Bus Name & Registration */}
                        <View style={styles.itemHeader}>
                          <Text style={[styles.busName, { color: colors.textPrimary }]}>
                            {bus.model} • <Text style={styles.busRegText}>{bus.registrationNumber}</Text>
                          </Text>
                        </View>

                        {/* Assigned Driver and Conductor */}
                        <View style={styles.itemCrewRow}>
                          <Text style={[styles.crewInlineText, { color: colors.textSecondary }]}>
                            👤 Driver:{' '}
                            <Text style={{ color: bus.driverName ? '#38bdf8' : colors.textMuted, fontWeight: '700' }}>
                              {bus.driverName || 'None'}
                            </Text>
                          </Text>
                          <Text style={{ color: colors.textMuted, marginHorizontal: 4 }}>•</Text>
                          <Text style={[styles.crewInlineText, { color: colors.textSecondary }]}>
                            🎫 Conductor:{' '}
                            <Text style={{ color: bus.conductorName ? '#34d399' : colors.textMuted, fontWeight: '700' }}>
                              {bus.conductorName || 'None'}
                            </Text>
                          </Text>
                        </View>

                        {/* Transport Operator */}
                        <Text style={[styles.itemOperatorText, { color: colors.textMuted }]}>
                          Transport: {bus.operatorName}
                        </Text>
                      </View>

                      <View style={styles.selectArrowBox}>
                        <Text style={styles.selectArrow}>Select ➔</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        )}
      </View>

      <View style={styles.roleRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>ROLE *</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            title="DRIVER"
            variant={role === 'DRIVER' ? 'primary' : 'outline'}
            size="sm"
            onPress={() => setRole('DRIVER')}
          />
          <Button
            title="CONDUCTOR"
            variant={role === 'CONDUCTOR' ? 'mint' : 'outline'}
            size="sm"
            onPress={() => setRole('CONDUCTOR')}
          />
        </View>
      </View>

      <TextInput
        label="FULL NAME *"
        placeholder="e.g. Suresh Kumar"
        value={fullName}
        onChangeText={setFullName}
        autoComplete="off"
      />
      <TextInput
        label="MOBILE NUMBER *"
        placeholder="10-digit, starts with 6-9"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoComplete="off"
      />
      <TextInput
        label="EMAIL (OPTIONAL)"
        placeholder="staff@company.in"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="off"
      />
      <TextInput
        label="INITIAL PASSWORD *"
        placeholder="Min. 8 characters"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        leftIcon="🔒"
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorText: { color: '#fca5a5', fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 14 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  selectedBusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 10,
  },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  busEmoji: { fontSize: 15 },
  selectedTitle: { fontSize: 14, fontWeight: '800' },
  selectedSub: { fontSize: 11, marginTop: 4 },
  crewRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  crewBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  crewLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  crewValue: { fontSize: 11, fontWeight: '700' },
  changeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  changeBtnText: { fontSize: 11, fontWeight: '700', color: '#00D488' },
  dropdownContainer: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  loadingBox: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyResults: { padding: 14, alignItems: 'center' },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  itemHeader: {
    marginBottom: 3,
  },
  busName: {
    fontSize: 13,
    fontWeight: '800',
  },
  busRegText: {
    color: '#00D488',
    fontWeight: '800',
  },
  itemCrewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    flexWrap: 'wrap',
  },
  crewInlineText: {
    fontSize: 11,
  },
  itemOperatorText: {
    fontSize: 11,
    marginTop: 1,
  },
  selectArrowBox: {
    paddingLeft: 6,
  },
  selectArrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#a855f7',
  },
  roleRow: { marginBottom: 8 },
});
