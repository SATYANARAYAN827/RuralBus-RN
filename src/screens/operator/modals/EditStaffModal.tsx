/**
 * Edit Staff Member Modal
 * Allows updating staff name, assigning and unassigning staff to/from buses,
 * or removing staff member under the operator tenant.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Modal, Button, TextInput, Badge } from '../../../components/common';
import { useTheme } from '../../../theme';
import { useOperatorStore } from '../../../stores/operator.store';

export const EditStaffModal: React.FC = () => {
  const { colors, isLight } = useTheme();
  const {
    isEditStaffModalOpen,
    setIsEditStaffModalOpen,
    editingStaff,
    setEditingStaff,
    updateStaff,
    assignStaffToBus,
    deleteStaff,
    buses,
    fetchBuses,
    isLoadingStaff,
  } = useOperatorStore();

  const [fullName, setFullName] = useState('');
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [busSearch, setBusSearch] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editingStaff) {
      setFullName(editingStaff.fullName);
      setSelectedBusId(editingStaff.busId || null);
      setBusSearch('');
      setFormError(null);
    }
  }, [editingStaff]);

  useEffect(() => {
    if (isEditStaffModalOpen) {
      fetchBuses();
    }
  }, [isEditStaffModalOpen, fetchBuses]);

  // Include all non-decommissioned fleet buses
  const availableBuses = buses.filter((b) => b.status !== 'DECOMMISSIONED');

  const selectedBus = availableBuses.find((b) => b.id === selectedBusId);

  const filteredBuses = availableBuses.filter((b) => {
    if (!busSearch.trim()) return true;
    const q = busSearch.toLowerCase();
    const matchReg = b.registrationNumber?.toLowerCase().includes(q);
    const matchModel = b.model?.toLowerCase().includes(q);
    return matchReg || matchModel;
  });

  const handleSave = async () => {
    if (!editingStaff) return;
    setFormError(null);

    if (fullName.trim().length < 2) {
      setFormError('Full name must be at least 2 characters');
      return;
    }

    const success = await updateStaff(editingStaff.id, {
      fullName: fullName.trim(),
      busId: selectedBusId,
    });

    if (success) {
      setIsEditStaffModalOpen(false);
      setEditingStaff(null);
    }
  };

  const handleQuickUnassign = async () => {
    setSelectedBusId(null);
  };

  const handleDelete = async () => {
    if (!editingStaff) return;
    const success = await deleteStaff(editingStaff.id);
    if (success) {
      setIsEditStaffModalOpen(false);
      setEditingStaff(null);
    }
  };

  if (!editingStaff) return null;

  return (
    <Modal
      isOpen={isEditStaffModalOpen}
      onClose={() => {
        setIsEditStaffModalOpen(false);
        setEditingStaff(null);
      }}
      title={`Edit Staff: ${editingStaff.fullName}`}
      subtitle={`${editingStaff.role} • ${editingStaff.phone}`}
      icon={editingStaff.role === 'DRIVER' ? '👨‍✈️' : '🎫'}
      actions={
        <View style={styles.actionRow}>
          <Button
            title="Delete Staff"
            variant="danger"
            size="sm"
            onPress={handleDelete}
          />
          <View style={{ flex: 1 }} />
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            onPress={() => {
              setIsEditStaffModalOpen(false);
              setEditingStaff(null);
            }}
          />
          <Button
            title={isLoadingStaff ? 'Saving...' : 'Save Changes'}
            variant="primary"
            size="md"
            isLoading={isLoadingStaff}
            onPress={handleSave}
          />
        </View>
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
        {formError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {formError}</Text>
          </View>
        )}

        <TextInput
          label="FULL NAME *"
          placeholder="Staff full name"
          value={fullName}
          onChangeText={setFullName}
          style={styles.field}
        />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ROLE:</Text>
          <Text style={[styles.infoValue, { color: '#00D488' }]}>{editingStaff.role}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>PHONE:</Text>
          <Text style={styles.infoValue}>{editingStaff.phone}</Text>
        </View>

        {/* Vehicle Assignment Section */}
        <View style={styles.assignmentSection}>
          <View style={styles.assignmentHeaderRow}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              ASSIGNED VEHICLE
            </Text>
            {selectedBusId ? (
              <TouchableOpacity
                onPress={handleQuickUnassign}
                style={styles.unassignLinkBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.unassignLinkText}>✕ Unassign</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Current Selection Card */}
          {selectedBus ? (
            <View
              style={[
                styles.selectedBusCard,
                {
                  backgroundColor: isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.12)',
                  borderColor: '#00D488',
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Text style={[styles.selectedBusTitle, { color: isLight ? '#0f172a' : '#ffffff' }]}>
                    🚌 {selectedBus.registrationNumber}
                  </Text>
                  <Badge
                    label={selectedBus.status.replace('_', ' ')}
                    variant={selectedBus.status === 'ACTIVE' ? 'mint' : 'neutral'}
                    size="sm"
                  />
                </View>
                <Text style={[styles.selectedBusSub, { color: colors.textSecondary }]}>
                  {selectedBus.model} • {selectedBus.totalSeats} Seats ({selectedBus.seatingType?.replace('_', ' ') || '2x2'})
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleQuickUnassign}
                style={[
                  styles.unassignBadgeBtn,
                  {
                    backgroundColor: isLight ? '#fee2e2' : 'rgba(225, 29, 72, 0.15)',
                    borderColor: isLight ? '#fca5a5' : 'rgba(225, 29, 72, 0.35)',
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text style={[styles.unassignBadgeText, { color: isLight ? '#be123c' : '#fb7185' }]}>
                  Unassign
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.unassignedCard,
                {
                  backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)',
                  borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.10)',
                },
              ]}
            >
              <Text style={{ fontSize: 16 }}>🚫</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.unassignedTitle, { color: colors.textPrimary }]}>
                  Unassigned (Standby Pool)
                </Text>
                <Text style={[styles.unassignedSub, { color: colors.textMuted }]}>
                  Staff member is not assigned to any bus. Select a vehicle below to assign.
                </Text>
              </View>
            </View>
          )}

          {/* Bus Selector / Search List */}
          <Text style={[styles.subSectionTitle, { color: colors.textSecondary, marginTop: 12 }]}>
            SELECT A BUS TO ASSIGN:
          </Text>

          {availableBuses.length > 3 && (
            <TextInput
              placeholder="Search bus by registration or model..."
              value={busSearch}
              onChangeText={setBusSearch}
              leftIcon="🔍"
              style={{ marginBottom: 8 }}
            />
          )}

          <ScrollView style={styles.busListScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {/* Standby / Unassign Option */}
            <TouchableOpacity
              style={[
                styles.busOptionCard,
                {
                  backgroundColor:
                    selectedBusId === null
                      ? isLight
                        ? '#ecfdf5'
                        : 'rgba(0, 212, 136, 0.15)'
                      : isLight
                      ? '#ffffff'
                      : 'rgba(255, 255, 255, 0.03)',
                  borderColor:
                    selectedBusId === null
                      ? '#00D488'
                      : isLight
                      ? '#e2e8f0'
                      : 'rgba(255, 255, 255, 0.08)',
                },
              ]}
              onPress={() => setSelectedBusId(null)}
              activeOpacity={0.75}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Text style={{ fontSize: 16 }}>🚫</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.busOptionTitle, { color: colors.textPrimary }]}>
                    Standby Pool (Unassigned)
                  </Text>
                  <Text style={[styles.busOptionSub, { color: colors.textMuted }]}>
                    Keep or move this staff member to standby roster
                  </Text>
                </View>
              </View>
              {selectedBusId === null && (
                <Text style={{ color: '#00D488', fontWeight: '900', fontSize: 14 }}>✓ Active</Text>
              )}
            </TouchableOpacity>

            {/* Available Buses */}
            {filteredBuses.map((bus) => {
              const isSelected = selectedBusId === bus.id;
              const hasDriver = bus.driverName || bus.assignedDriver?.name;
              const hasConductor = bus.conductorName || bus.assignedConductor?.name;

              return (
                <TouchableOpacity
                  key={bus.id}
                  style={[
                    styles.busOptionCard,
                    {
                      backgroundColor: isSelected
                        ? isLight
                          ? '#ecfdf5'
                          : 'rgba(0, 212, 136, 0.15)'
                        : isLight
                        ? '#ffffff'
                        : 'rgba(255, 255, 255, 0.03)',
                      borderColor: isSelected
                        ? '#00D488'
                        : isLight
                        ? '#e2e8f0'
                        : 'rgba(255, 255, 255, 0.08)',
                    },
                  ]}
                  onPress={() => setSelectedBusId(bus.id)}
                  activeOpacity={0.75}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <Text style={{ fontSize: 20 }}>🚌</Text>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.busOptionTitle, { color: colors.textPrimary }]}>
                          {bus.registrationNumber}
                        </Text>
                        <Badge
                          label={bus.status.replace('_', ' ')}
                          variant={bus.status === 'ACTIVE' ? 'mint' : 'neutral'}
                          size="sm"
                        />
                      </View>
                      <Text style={[styles.busOptionSub, { color: colors.textSecondary }]}>
                        {bus.model} • {bus.totalSeats} seats
                        {hasDriver ? ` • 👨‍✈️ ${hasDriver}` : ''}
                        {hasConductor ? ` • 🎫 ${hasConductor}` : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginLeft: 8 }}>
                    {isSelected ? (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>✓ Selected</Text>
                      </View>
                    ) : (
                      <Text style={styles.selectBtnText}>Assign ➔</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {availableBuses.length === 0 && (
              <View style={styles.emptyBusesBox}>
                <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>
                  No buses registered yet. Register a vehicle in Fleet Buses first to assign staff.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  formScroll: {
    maxHeight: 520,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  field: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  assignmentSection: {
    marginTop: 12,
  },
  assignmentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  unassignLinkBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  unassignLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f43f5e',
  },
  selectedBusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  selectedBusTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  selectedBusSub: {
    fontSize: 11,
    marginTop: 2,
  },
  unassignBadgeBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  unassignBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  unassignedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  unassignedTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  unassignedSub: {
    fontSize: 11,
    marginTop: 1,
  },
  busListScroll: {
    maxHeight: 180,
    gap: 6,
  },
  busOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  busOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  busOptionSub: {
    fontSize: 11,
    marginTop: 1,
  },
  selectedBadge: {
    backgroundColor: '#00D488',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  selectedBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
  selectBtnText: {
    color: '#00D488',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyBusesBox: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
