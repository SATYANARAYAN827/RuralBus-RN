/**
 * Edit Staff Member Modal
 * Allows updating staff name, bus assignment, or removing staff member.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Modal, Button, TextInput } from '../../../components/common';
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
    deleteStaff,
    buses,
    isLoadingStaff,
  } = useOperatorStore();

  const [fullName, setFullName] = useState('');
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editingStaff) {
      setFullName(editingStaff.fullName);
      setSelectedBusId(editingStaff.busId || null);
    }
  }, [editingStaff]);

  const activeBuses = buses.filter((b) => b.status === 'ACTIVE');

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

        <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 14 }]}>
          ASSIGNED BUS
        </Text>
        <View style={styles.pillRow}>
          <TouchableOpacity
            style={[
              styles.pill,
              {
                backgroundColor: selectedBusId === null
                  ? '#00D488'
                  : isLight
                  ? '#f1f5f9'
                  : 'rgba(255,255,255,0.08)',
              },
            ]}
            onPress={() => setSelectedBusId(null)}
          >
            <Text
              style={[
                styles.pillText,
                { color: selectedBusId === null ? '#000000' : colors.textPrimary },
              ]}
            >
              Unassigned
            </Text>
          </TouchableOpacity>
          {activeBuses.map((b) => {
            const isSelected = selectedBusId === b.id;
            return (
              <TouchableOpacity
                key={b.id}
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
                onPress={() => setSelectedBusId(b.id)}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isSelected ? '#000000' : colors.textPrimary },
                  ]}
                >
                  🚌 {b.registrationNumber || b.model}
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
