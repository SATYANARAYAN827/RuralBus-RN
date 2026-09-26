import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal, Button, TextInput } from '../../../components/common';
import { useSuperAdminStore } from '../../../stores/superadmin.store';
import type { PlatformOperator } from '../../../types/superadmin.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  operator: PlatformOperator;
}

export const EditOperatorModal: React.FC<Props> = ({ isOpen, onClose, operator }) => {
  const { updateOperator, isLoadingOperators, operatorError } = useSuperAdminStore();

  const [companyName, setCompanyName] = useState(operator.companyName);
  const [ownerName, setOwnerName] = useState(operator.ownerName || '');
  const [contactPhone, setContactPhone] = useState(operator.contactPhone || '');
  const [contactEmail, setContactEmail] = useState(operator.contactEmail || '');
  const [corridor, setCorridor] = useState(operator.corridor || '');
  const [status, setStatus] = useState<'ACTIVE' | 'SUSPENDED'>(
    operator.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE'
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setCompanyName(operator.companyName);
    setOwnerName(operator.ownerName || '');
    setContactPhone(operator.contactPhone || '');
    setContactEmail(operator.contactEmail || '');
    setCorridor(operator.corridor || '');
    setStatus(operator.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE');
    setValidationError(null);
  }, [operator]);

  const handleSubmit = async () => {
    setValidationError(null);
    if (companyName.trim().length < 2) {
      setValidationError('Company name must be at least 2 characters.');
      return;
    }
    const ok = await updateOperator(operator.id, {
      companyName: companyName.trim(),
      ownerName: ownerName.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      corridor: corridor.trim() || undefined,
      status,
    });
    if (ok) onClose();
  };

  const error = validationError || operatorError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Operator"
      subtitle={operator.businessCode}
      icon="??"
      actions={
        <>
          <Button title="Cancel" variant="outline" size="md" onPress={onClose} />
          <Button
            title={isLoadingOperators ? 'Saving...' : 'Save Changes'}
            variant="primary"
            size="md"
            onPress={handleSubmit}
            isLoading={isLoadingOperators}
          />
        </>
      }
    >
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>?? {error}</Text>
        </View>
      ) : null}

      <TextInput label="COMPANY NAME *" value={companyName} onChangeText={setCompanyName} />
      <TextInput label="OWNER NAME" value={ownerName} onChangeText={setOwnerName} />
      <TextInput label="CONTACT PHONE" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
      <TextInput label="CONTACT EMAIL" value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" />
      <TextInput label="CORRIDOR" placeholder="e.g. State Rural Corridor" value={corridor} onChangeText={setCorridor} />

      <View style={styles.statusRow}>
        <Button
          title="ACTIVE"
          variant={status === 'ACTIVE' ? 'mint' : 'outline'}
          size="sm"
          onPress={() => setStatus('ACTIVE')}
        />
        <Button
          title="SUSPENDED"
          variant={status === 'SUSPENDED' ? 'danger' : 'outline'}
          size="sm"
          onPress={() => setStatus('SUSPENDED')}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  errorBox: { backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#ef4444' },
  errorText: { color: '#fca5a5', fontSize: 13, fontWeight: '600' },
  statusRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
