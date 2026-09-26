import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Modal, Button, TextInput } from '../../../components/common';
import { useTheme } from '../../../theme';
import { useSuperAdminStore } from '../../../stores/superadmin.store';
import type { PlatformOperator } from '../../../types/superadmin.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  operators: PlatformOperator[];
}

export const AddPlatformStaffModal: React.FC<Props> = ({ isOpen, onClose, operators }) => {
  const { colors } = useTheme();
  const { createStaff, isLoadingStaff, staffError } = useSuperAdminStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'DRIVER' | 'CONDUCTOR'>('DRIVER');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const reset = () => {
    setFullName(''); setPhone(''); setEmail(''); setRole('DRIVER');
    setPassword(''); setTenantId(''); setValidationError(null);
  };

  const handleSubmit = async () => {
    setValidationError(null);
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
    if (!tenantId) {
      setValidationError('Select the target operator (tenantId is required).');
      return;
    }

    const ok = await createStaff({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      role,
      password,
      tenantId,
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
      onClose={() => { reset(); onClose(); }}
      title="Provision Staff Member"
      subtitle="Assign a driver or conductor to an operator"
      icon="??"
      actions={
        <>
          <Button title="Cancel" variant="outline" size="md" onPress={() => { reset(); onClose(); }} />
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
          <Text style={styles.errorText}>?? {error}</Text>
        </View>
      ) : null}

      <Text style={[styles.label, { color: colors.textSecondary }]}>TARGET OPERATOR *</Text>
      <View style={styles.operatorList}>
        {operators.length === 0 ? (
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>No operators available.</Text>
        ) : (
          operators.map((op) => (
            <TouchableOpacity
              key={op.id}
              onPress={() => setTenantId(op.id)}
              style={[
                styles.opOption,
                {
                  backgroundColor: tenantId === op.id ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
                  borderColor: tenantId === op.id ? '#a855f7' : 'rgba(255,255,255,0.1)',
                },
              ]}
            >
              <Text style={{ color: tenantId === op.id ? '#a855f7' : colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                {op.companyName}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{op.businessCode}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.roleRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>ROLE *</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="DRIVER" variant={role === 'DRIVER' ? 'primary' : 'outline'} size="sm" onPress={() => setRole('DRIVER')} />
          <Button title="CONDUCTOR" variant={role === 'CONDUCTOR' ? 'mint' : 'outline'} size="sm" onPress={() => setRole('CONDUCTOR')} />
        </View>
      </View>

      <TextInput label="FULL NAME *" placeholder="e.g. Suresh Kumar" value={fullName} onChangeText={setFullName} />
      <TextInput label="MOBILE NUMBER *" placeholder="10-digit, starts with 6-9" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput label="EMAIL (OPTIONAL)" placeholder="staff@company.in" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput label="INITIAL PASSWORD *" placeholder="Min. 8 characters" value={password} onChangeText={setPassword} secureTextEntry leftIcon="??" />
    </Modal>
  );
};

const styles = StyleSheet.create({
  errorBox: { backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#ef4444' },
  errorText: { color: '#fca5a5', fontSize: 13, fontWeight: '600' },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  operatorList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  opOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  roleRow: { marginBottom: 8 },
});
