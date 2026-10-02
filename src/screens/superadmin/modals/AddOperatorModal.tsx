import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Modal, Button, TextInput } from '../../../components/common';
import { useTheme } from '../../../theme';
import { useSuperAdminStore } from '../../../stores/superadmin.store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AddOperatorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { colors } = useTheme();
  const { createOperator, isLoadingOperators, operatorError } = useSuperAdminStore();

  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessCode, setBusinessCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const reset = () => {
    setCompanyName('');
    setOwnerName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setBusinessCode('');
    setValidationError(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setValidationError(null);
    if (!companyName.trim() || companyName.trim().length < 2) {
      setValidationError('Company name must be at least 2 characters.');
      return;
    }
    if (!ownerName.trim() || ownerName.trim().length < 2) {
      setValidationError('Owner name must be at least 2 characters.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setValidationError('Enter a valid 10-digit Indian mobile number starting with 6-9.');
      return;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }

    const ok = await createOperator({
      companyName: companyName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      password,
      businessCode: businessCode.trim() || undefined,
    });

    if (ok) {
      reset();
      onClose();
    }
  };

  const error = validationError || operatorError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { reset(); onClose(); }}
      title="Register Transport Operator"
      subtitle="Creates operator account + owner login credentials"
      icon="🏢"
      actions={
        <>
          <Button title="Cancel" variant="outline" size="md" onPress={() => { reset(); onClose(); }} />
          <Button
            title={isLoadingOperators ? 'Creating...' : 'Create Operator'}
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
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      <View style={{ gap: 4 }}>
        <Text style={[styles.smsNote, { color: colors.textSecondary }]}>
          📱 Initial credentials will be sent via SMS to the owner's mobile number.
        </Text>
      </View>

      <TextInput
        label="COMPANY NAME *"
        placeholder="e.g. Odisha State Bus Corp"
        value={companyName}
        onChangeText={setCompanyName}
        autoComplete="off"
      />
      <TextInput
        label="OWNER FULL NAME *"
        placeholder="e.g. Ramesh Patel"
        value={ownerName}
        onChangeText={setOwnerName}
        autoComplete="off"
      />
      <TextInput
        label="OWNER MOBILE (10-DIGIT) *"
        placeholder="e.g. 9876543210"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoComplete="off"
      />
      <TextInput
        label="OWNER EMAIL (OPTIONAL)"
        placeholder="e.g. owner@company.in"
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
      <TextInput
        label="BUSINESS CODE (OPTIONAL)"
        placeholder="Auto-generated if blank"
        value={businessCode}
        onChangeText={setBusinessCode}
        autoComplete="off"
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  errorBox: { backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#ef4444' },
  errorText: { color: '#fca5a5', fontSize: 13, fontWeight: '600' },
  smsNote: { fontSize: 12, marginBottom: 8 },
});
