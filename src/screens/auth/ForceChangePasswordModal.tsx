import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../../stores/auth.store';
import { AUTH_TRANSLATIONS } from '../../theme/i18n';
import { Modal, Button, TextInput } from '../../components/common';

export interface ForceChangePasswordModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
}

export const ForceChangePasswordModal: React.FC<ForceChangePasswordModalProps> = ({
  isOpen,
  onSuccess,
}) => {
  const authStore = useAuthStore();
  const t = AUTH_TRANSLATIONS[authStore.lang] || AUTH_TRANSLATIONS.EN;

  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!currPass) {
      setErrorMsg('Please enter your current or temporary password');
      return;
    }
    if (!newPass || newPass.length < 6) {
      setErrorMsg('New password must be at least 6 characters long');
      return;
    }
    if (newPass !== confirmPass) {
      setErrorMsg('New passwords do not match');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await authStore.forceChangePassword(currPass, newPass);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Mandatory security modal, cannot be dismissed without completing
      title={t.forceChange.title}
      subtitle={t.forceChange.subtitle}
      icon="🛡️"
      iconBg="rgba(225, 29, 72, 0.12)"
      iconColor="#e11d48"
      maxWidth={440}
    >
      <View style={styles.content}>
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        <TextInput
          label={t.forceChange.currPassLabel}
          placeholder={t.forceChange.currPassPlaceholder}
          value={currPass}
          onChangeText={setCurrPass}
          secureTextEntry
          leftIcon="🔒"
          required
        />

        <TextInput
          label={t.forceChange.newPassLabel}
          placeholder={t.forceChange.newPassPlaceholder}
          value={newPass}
          onChangeText={setNewPass}
          secureTextEntry
          leftIcon="🔒"
          required
        />

        <TextInput
          label={t.forceChange.confirmPassLabel}
          placeholder={t.forceChange.confirmPassPlaceholder}
          value={confirmPass}
          onChangeText={setConfirmPass}
          secureTextEntry
          leftIcon="🔒"
          required
        />

        <Button
          title={loading ? t.forceChange.updating : t.forceChange.submitBtn}
          variant="primary"
          size="lg"
          fullWidth
          isLoading={loading}
          onPress={handleSubmit}
          style={{ marginTop: 12 }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 8,
  },
  errorBanner: {
    padding: 10,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderColor: 'rgba(225, 29, 72, 0.35)',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#e11d48',
    fontSize: 12,
    fontWeight: '700',
  },
});
