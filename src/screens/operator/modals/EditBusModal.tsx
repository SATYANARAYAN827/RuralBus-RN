/**
 * Edit Fleet Bus Modal
 * Supports model update, seating capacity, status transitions (ACTIVE/MAINTENANCE),
 * and driver / conductor assignment from authoritative staff list.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Modal, Button, TextInput } from '../../../components/common';
import { useTheme } from '../../../theme';
import { useOperatorStore } from '../../../stores/operator.store';
import { BusSeatingType, BusStatus } from '../../../types/operator.types';

export const EditBusModal: React.FC = () => {
  const { colors, isLight } = useTheme();
  const {
    isEditBusModalOpen,
    setIsEditBusModalOpen,
    editingBus,
    setEditingBus,
    updateBus,
    decommissionBus,
    staff,
    fetchStaff,
    isLoadingBuses,
  } = useOperatorStore();

  const [model, setModel] = useState('');
  const [totalSeats, setTotalSeats] = useState('40');
  const [seatingType, setSeatingType] = useState<BusSeatingType>('SEATER_2X2');
  const [status, setStatus] = useState<BusStatus>('ACTIVE');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedConductorId, setSelectedConductorId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editingBus) {
      setModel(editingBus.model || '');
      setTotalSeats(String(editingBus.totalSeats || 40));
      setSeatingType(editingBus.seatingType || 'SEATER_2X2');
      setStatus(editingBus.status || 'ACTIVE');
      setSelectedDriverId(editingBus.assignedDriver?.userId || null);
      setSelectedConductorId(editingBus.assignedConductor?.userId || null);
    }
  }, [editingBus]);

  useEffect(() => {
    if (isEditBusModalOpen && staff.length === 0) {
      fetchStaff();
    }
  }, [isEditBusModalOpen, staff.length, fetchStaff]);

  const drivers = staff.filter((s) => s.role === 'DRIVER' && s.isActive);
  const conductors = staff.filter((s) => s.role === 'CONDUCTOR' && s.isActive);

  const handleSave = async () => {
    if (!editingBus) return;
    setFormError(null);

    const seats = parseInt(totalSeats, 10);
    if (isNaN(seats) || seats < 10 || seats > 80) {
      setFormError('Total seats must be a number between 10 and 80');
      return;
    }

    const success = await updateBus(editingBus.id, {
      model: model.trim() || undefined,
      totalSeats: seats,
      seatingType,
      status,
      driverId: selectedDriverId,
      conductorId: selectedConductorId,
    });

    if (success) {
      setIsEditBusModalOpen(false);
      setEditingBus(null);
    }
  };

  const handleDecommission = async () => {
    if (!editingBus) return;
    const success = await decommissionBus(editingBus.id);
    if (success) {
      setIsEditBusModalOpen(false);
      setEditingBus(null);
    }
  };

  if (!editingBus) return null;

  return (
    <Modal
      isOpen={isEditBusModalOpen}
      onClose={() => {
        setIsEditBusModalOpen(false);
        setEditingBus(null);
      }}
      title={`Edit Bus: ${editingBus.registrationNumber || 'Unassigned'}`}
      subtitle={`Tenant ID: ${editingBus.tenantId.substring(0, 8)}...`}
      icon="🚌"
      actions={
        <View style={styles.actionRow}>
          {editingBus.status !== 'DECOMMISSIONED' && (
            <Button
              title="Decommission"
              variant="danger"
              size="sm"
              onPress={handleDecommission}
            />
          )}
          <View style={{ flex: 1 }} />
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            onPress={() => {
              setIsEditBusModalOpen(false);
              setEditingBus(null);
            }}
          />
          <Button
            title={isLoadingBuses ? 'Saving...' : 'Save Changes'}
            variant="primary"
            size="md"
            isLoading={isLoadingBuses}
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
          label="BUS MODEL"
          placeholder="Model name"
          value={model}
          onChangeText={setModel}
          style={styles.field}
        />

        <TextInput
          label="SEATING CAPACITY (10 - 80)"
          placeholder="40"
          value={totalSeats}
          onChangeText={setTotalSeats}
          keyboardType="numeric"
          style={styles.field}
        />

        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>OPERATIONAL STATUS</Text>
        <View style={styles.pillRow}>
          {(['ACTIVE', 'MAINTENANCE', 'PENDING_APPROVAL'] as BusStatus[]).map((st) => {
            const isSelected = status === st;
            return (
              <TouchableOpacity
                key={st}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected
                      ? '#00D488'
                      : isLight
                      ? '#f1f5f9'
                      : 'rgba(255,255,255,0.08)',
                  },
                ]}
                onPress={() => setStatus(st)}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isSelected ? '#000000' : colors.textPrimary },
                  ]}
                >
                  {st.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 14 }]}>
          ASSIGNED DRIVER
        </Text>
        <View style={styles.pillRow}>
          <TouchableOpacity
            style={[
              styles.pill,
              {
                backgroundColor: selectedDriverId === null
                  ? '#00D488'
                  : isLight
                  ? '#f1f5f9'
                  : 'rgba(255,255,255,0.08)',
              },
            ]}
            onPress={() => setSelectedDriverId(null)}
          >
            <Text
              style={[
                styles.pillText,
                { color: selectedDriverId === null ? '#000000' : colors.textPrimary },
              ]}
            >
              Unassigned
            </Text>
          </TouchableOpacity>
          {drivers.map((d) => {
            const isSelected = selectedDriverId === d.userId;
            return (
              <TouchableOpacity
                key={d.userId}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected
                      ? '#00D488'
                      : isLight
                      ? '#f1f5f9'
                      : 'rgba(255,255,255,0.08)',
                  },
                ]}
                onPress={() => setSelectedDriverId(d.userId)}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isSelected ? '#000000' : colors.textPrimary },
                  ]}
                >
                  👨‍✈️ {d.fullName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 14 }]}>
          ASSIGNED CONDUCTOR
        </Text>
        <View style={styles.pillRow}>
          <TouchableOpacity
            style={[
              styles.pill,
              {
                backgroundColor: selectedConductorId === null
                  ? '#00D488'
                  : isLight
                  ? '#f1f5f9'
                  : 'rgba(255,255,255,0.08)',
              },
            ]}
            onPress={() => setSelectedConductorId(null)}
          >
            <Text
              style={[
                styles.pillText,
                { color: selectedConductorId === null ? '#000000' : colors.textPrimary },
              ]}
            >
              Unassigned
            </Text>
          </TouchableOpacity>
          {conductors.map((c) => {
            const isSelected = selectedConductorId === c.userId;
            return (
              <TouchableOpacity
                key={c.userId}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected
                      ? '#00D488'
                      : isLight
                      ? '#f1f5f9'
                      : 'rgba(255,255,255,0.08)',
                  },
                ]}
                onPress={() => setSelectedConductorId(c.userId)}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isSelected ? '#000000' : colors.textPrimary },
                  ]}
                >
                  🎫 {c.fullName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  formScroll: {
    maxHeight: 460,
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
