import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Modal, Button, TextInput, Badge } from '../../../components/common';
import { useTheme } from '../../../theme';
import { useSuperAdminStore } from '../../../stores/superadmin.store';
import type { PlatformStaffMember } from '../../../types/superadmin.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  staff: PlatformStaffMember;
}

export const EditStaffModal: React.FC<Props> = ({ isOpen, onClose, staff }) => {
  const { colors, isLight } = useTheme();
  const { updateStaff, updateStaffStatus, buses, isLoadingStaff, staffError } = useSuperAdminStore();

  const [fullName, setFullName] = useState(staff.fullName);
  const [selectedBusId, setSelectedBusId] = useState(staff.busId || '');
  const [isActive, setIsActive] = useState(staff.isActive);
  const [busSearch, setBusSearch] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFullName(staff.fullName);
    setSelectedBusId(staff.busId || '');
    setIsActive(staff.isActive);
    setBusSearch('');
    setValidationError(null);
  }, [staff]);

  const tenantBuses = buses.filter((b) => b.tenantId === staff.tenantId);
  const selectedBus = buses.find((b) => b.id === selectedBusId);

  const handleSubmit = async () => {
    setValidationError(null);
    if (!fullName.trim() || fullName.trim().length < 2) {
      setValidationError('Full Name must be at least 2 characters.');
      return;
    }

    setIsSaving(true);
    try {
      const ok = await updateStaff(staff.id, {
        fullName: fullName.trim(),
        busId: selectedBusId || null,
      });

      if (isActive !== staff.isActive) {
        await updateStaffStatus(staff.id, isActive);
      }

      if (ok) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const error = validationError || staffError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Staff Member"
      subtitle={`${staff.role} • ${staff.phone}`}
      icon="✏️"
      actions={
        <>
          <Button title="Cancel" variant="outline" size="md" onPress={onClose} />
          <Button
            title={isSaving || isLoadingStaff ? 'Saving...' : 'Save Changes'}
            variant="primary"
            size="md"
            onPress={handleSubmit}
            isLoading={isSaving || isLoadingStaff}
          />
        </>
      }
    >
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      <TextInput
        label="FULL NAME *"
        value={fullName}
        onChangeText={setFullName}
        placeholder="e.g. Suresh Kumar"
      />

      <View style={styles.fieldSection}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          ASSIGNED BUS
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
              <Text style={[styles.selectedBusTitle, { color: colors.textPrimary }]}>
                🚌 {selectedBus.model} ({selectedBus.registrationNumber})
              </Text>
              <Text style={[styles.selectedBusSub, { color: colors.textMuted }]}>
                {selectedBus.operatorName} • {selectedBus.totalSeats} Seats
              </Text>
            </View>
            <TouchableOpacity
              style={styles.changeBtn}
              onPress={() => setSelectedBusId('')}
            >
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.busPickerContainer}>
            <TextInput
              placeholder="Search bus..."
              value={busSearch}
              onChangeText={setBusSearch}
              leftIcon="🔍"
            />
            <ScrollView style={{ maxHeight: 130 }} nestedScrollEnabled>
              {tenantBuses
                .filter(
                  (b) =>
                    !busSearch ||
                    b.registrationNumber.toLowerCase().includes(busSearch.toLowerCase()) ||
                    b.model.toLowerCase().includes(busSearch.toLowerCase())
                )
                .map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={styles.busItem}
                    onPress={() => setSelectedBusId(b.id)}
                  >
                    <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>
                      🚌 {b.model} • <Text style={{ color: '#00D488' }}>{b.registrationNumber}</Text>
                    </Text>
                    <Text style={styles.selectText}>Select ➔</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={styles.fieldSection}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          ACCOUNT STATUS
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            title="ACTIVE"
            variant={isActive ? 'mint' : 'outline'}
            size="sm"
            onPress={() => setIsActive(true)}
          />
          <Button
            title="SUSPENDED"
            variant={!isActive ? 'danger' : 'outline'}
            size="sm"
            onPress={() => setIsActive(false)}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorText: { color: '#fca5a5', fontSize: 13, fontWeight: '600' },
  fieldSection: { marginBottom: 14 },
  fieldLabel: {
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
  },
  selectedBusTitle: { fontSize: 13, fontWeight: '800' },
  selectedBusSub: { fontSize: 11, marginTop: 2 },
  changeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  changeBtnText: { fontSize: 11, fontWeight: '700', color: '#00D488' },
  busPickerContainer: { marginTop: 4 },
  busItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  selectText: { fontSize: 11, color: '#a855f7', fontWeight: '700' },
});
