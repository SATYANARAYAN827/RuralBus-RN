/**
 * Reset Staff Password Modal
 * Provides secure operator-driven credential recovery for drivers and conductors.
 * Invariant: Never displays old or existing passwords; resets via Argon2id on backend.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal, Button, TextInput } from '../../../components/common';
import { useOperatorStore } from '../../../stores/operator.store';

export const ResetStaffPasswordModal: React.FC = () => {
  const {
    isResetPasswordModalOpen,
    setIsResetPasswordModalOpen,
    resetPasswordStaff,
    setResetPasswordStaff,
    resetStaffPassword,
    isLoadingStaff,
  } = useOperatorStore();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isResetPasswordModalOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isResetPasswordModalOpen]);

  const handleReset = async () => {
    if (!resetPasswordStaff) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    const success = await resetStaffPassword(resetPasswordStaff.id, newPassword);
    if (success) {
      setSuccessMsg('Staff password has been reset successfully. Staff member will be prompted to change password on first login.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsResetPasswordModalOpen(false);
        setResetPasswordStaff(null);
        setSuccessMsg(null);
      }, 1500);
    }
  };

  if (!resetPasswordStaff) return null;

  return (
    <Modal
      isOpen={isResetPasswordModalOpen}
      onClose={() => {
        setIsResetPasswordModalOpen(false);
        setResetPasswordStaff(null);
        setErrorMsg(null);
        setSuccessMsg(null);
      }}
      title={`Reset Password: ${resetPasswordStaff.fullName}`}
      subtitle={`${resetPasswordStaff.role} • ${resetPasswordStaff.phone}`}
      icon="🔑"
      actions={
        <>
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            onPress={() => {
              setIsResetPasswordModalOpen(false);
              setResetPasswordStaff(null);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
          />
          <Button
            title={isLoadingStaff ? 'Resetting...' : 'Confirm Reset'}
            variant="primary"
            size="md"
            isLoading={isLoadingStaff}
            onPress={handleReset}
          />
        </>
      }
    >
      <View style={styles.container}>
        <View style={styles.securityNote}>
          <Text style={styles.noteTitle}>🔒 Secure Password Policy</Text>
          <Text style={styles.noteText}>
            Must be at least 8 characters. The staff member will be flagged to
            change their password immediately upon their next authentication.
          </Text>
        </View>

        {errorMsg && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        )}

        {successMsg && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ {successMsg}</Text>
          </View>
        )}

        <TextInput
          label="NEW PASSWORD (MIN 8 CHARACTERS) *"
          placeholder="••••••••"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoComplete="new-password"
          style={styles.field}
        />

        <TextInput
          label="CONFIRM NEW PASSWORD *"
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          style={styles.field}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  securityNote: {
    backgroundColor: 'rgba(0, 212, 136, 0.08)',
    borderColor: 'rgba(0, 212, 136, 0.25)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00D488',
    marginBottom: 2,
  },
  noteText: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
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
  successBanner: {
    backgroundColor: 'rgba(0, 212, 136, 0.15)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  successText: {
    color: '#00D488',
    fontSize: 12,
    fontWeight: '700',
  },
  field: {
    marginBottom: 12,
  },
});
