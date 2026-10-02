import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Modal, Button, TextInput } from '../../../components/common';
import { useTheme } from '../../../theme';
import { useSuperAdminStore } from '../../../stores/superadmin.store';
import { superAdminService } from '../../../services/superadmin.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTenantId?: string;
  onSuccess?: () => void;
}

export const RegisterBusModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialTenantId,
  onSuccess,
}) => {
  const { colors, isLight } = useTheme();
  const { operators, fetchOperators } = useSuperAdminStore();

  const [tenantId, setTenantId] = useState('');
  const [operatorSearch, setOperatorSearch] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [model, setModel] = useState('');
  const [totalSeats, setTotalSeats] = useState('');
  const [seatingType, setSeatingType] = useState('SEATER_2X2');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const reset = () => {
    setTenantId(initialTenantId || '');
    setOperatorSearch('');
    setRegistrationNumber('');
    setModel('');
    setTotalSeats('');
    setSeatingType('SEATER_2X2');
    setValidationError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, initialTenantId]);

  const selectedOperator = operators.find((op) => op.id === tenantId);

  const filteredOperators = operators.filter((op) => {
    if (!operatorSearch.trim()) return true;
    const q = operatorSearch.toLowerCase();
    return (
      op.companyName.toLowerCase().includes(q) ||
      op.businessCode.toLowerCase().includes(q) ||
      (op.ownerName && op.ownerName.toLowerCase().includes(q))
    );
  });

  const handleSubmit = async () => {
    setValidationError(null);

    if (!tenantId) {
      setValidationError('Please select the target operator for this bus.');
      return;
    }
    if (!registrationNumber.trim() || registrationNumber.trim().length < 4) {
      setValidationError('Enter a valid vehicle registration number (e.g. KA-22-F-1001).');
      return;
    }
    if (!model.trim() || model.trim().length < 2) {
      setValidationError('Bus model name is required (e.g. Tata Starbus Ultra).');
      return;
    }

    const seatsNum = parseInt(totalSeats, 10);
    if (isNaN(seatsNum) || seatsNum < 8 || seatsNum > 100) {
      setValidationError('Enter a valid seating capacity between 8 and 100.');
      return;
    }

    setIsSubmitting(true);
    try {
      await superAdminService.registerBus({
        tenantId,
        registrationNumber: registrationNumber.trim().toUpperCase(),
        model: model.trim(),
        totalSeats: seatsNum,
        seatingType,
      });

      // Refresh operator bus counts immediately
      await fetchOperators();
      if (onSuccess) {
        onSuccess();
      }
      reset();
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to register bus to operator.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Register Bus to Owner"
      subtitle="Allocate a commercial fleet bus to an authorized operator"
      icon="🚌"
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
            title={isSubmitting ? 'Registering Bus...' : 'Register Bus'}
            variant="primary"
            size="md"
            onPress={handleSubmit}
            isLoading={isSubmitting}
          />
        </>
      }
    >
      {validationError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {validationError}</Text>
        </View>
      ) : null}

      {/* Target Operator Selector */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>TARGET OPERATOR *</Text>

        {selectedOperator ? (
          <View
            style={[
              styles.selectedOperatorCard,
              {
                backgroundColor: isLight ? 'rgba(0, 212, 136, 0.08)' : 'rgba(0, 212, 136, 0.12)',
                borderColor: '#00D488',
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.selectedRow}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={[styles.selectedTitle, { color: colors.textPrimary }]}>
                  {selectedOperator.companyName}
                </Text>
              </View>
              <Text style={[styles.selectedSub, { color: colors.textMuted }]}>
                Code: {selectedOperator.businessCode} • Owner: {selectedOperator.ownerName || 'Operator Admin'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.changeBtn}
              onPress={() => {
                setTenantId('');
                setOperatorSearch('');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TextInput
              placeholder="Search operator name or code..."
              value={operatorSearch}
              onChangeText={setOperatorSearch}
              leftIcon="🔍"
            />

            <View style={styles.operatorDropdown}>
              {filteredOperators.length === 0 ? (
                <View style={styles.emptyResults}>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    No operators found matching &quot;{operatorSearch}&quot;
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={{ maxHeight: 150 }}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >
                  {filteredOperators.slice(0, 8).map((op) => (
                    <TouchableOpacity
                      key={op.id}
                      style={[
                        styles.dropdownItem,
                        {
                          borderBottomColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
                        },
                      ]}
                      onPress={() => {
                        setTenantId(op.id);
                        setOperatorSearch('');
                      }}
                      activeOpacity={0.7}
                    >
                      <View>
                        <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                          {op.companyName}
                        </Text>
                        <Text style={[styles.itemSub, { color: colors.textMuted }]}>
                          {op.businessCode} • {op.ownerName || 'Operator Admin'}
                        </Text>
                      </View>
                      <Text style={styles.selectArrow}>Select ➔</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Registration Number */}
      <TextInput
        label="REGISTRATION NUMBER *"
        placeholder="e.g. KA-22-F-1001"
        value={registrationNumber}
        onChangeText={(text) => setRegistrationNumber(text.toUpperCase())}
        autoCapitalize="characters"
        autoComplete="off"
      />

      {/* Bus Model */}
      <TextInput
        label="BUS MODEL / VEHICLE NAME *"
        placeholder="e.g. Tata Starbus Ultra (AC)"
        value={model}
        onChangeText={setModel}
        autoComplete="off"
      />

      {/* Seating Capacity */}
      <TextInput
        label="SEATING CAPACITY *"
        placeholder="e.g. 32"
        value={totalSeats}
        onChangeText={setTotalSeats}
        keyboardType="numeric"
        autoComplete="off"
      />

      {/* Seating Type */}
      <View style={{ marginBottom: 12 }}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>SEATING TYPE</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'SEATER_2X2', label: '2x2 Seater' },
            { id: 'SEATER_2X1', label: '2x1 Seater' },
            { id: 'SLEEPER', label: 'Sleeper' },
          ].map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typePill,
                {
                  backgroundColor:
                    seatingType === type.id
                      ? 'rgba(0, 212, 136, 0.15)'
                      : isLight
                      ? '#f8fafc'
                      : 'rgba(255, 255, 255, 0.05)',
                  borderColor:
                    seatingType === type.id
                      ? '#00D488'
                      : isLight
                      ? '#cbd5e1'
                      : 'rgba(255, 255, 255, 0.12)',
                },
              ]}
              onPress={() => setSeatingType(type.id)}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: seatingType === type.id ? '800' : '600',
                  color: seatingType === type.id ? '#00D488' : colors.textPrimary,
                }}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
  selectedOperatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 10,
  },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkIcon: { color: '#00D488', fontSize: 14, fontWeight: '900' },
  selectedTitle: { fontSize: 14, fontWeight: '800' },
  selectedSub: { fontSize: 11, marginTop: 2 },
  changeBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  changeBtnText: { fontSize: 11, fontWeight: '700', color: '#00D488' },
  operatorDropdown: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  emptyResults: { padding: 12, alignItems: 'center' },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  itemTitle: { fontSize: 13, fontWeight: '700' },
  itemSub: { fontSize: 11, marginTop: 2 },
  selectArrow: { fontSize: 11, fontWeight: '700', color: '#00D488' },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
});
