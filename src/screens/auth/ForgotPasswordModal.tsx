import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { AUTH_TRANSLATIONS } from '../../theme/i18n';
import { Modal, Button, TextInput } from '../../components/common';

export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  onSuccess?: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialPhone = '',
  onSuccess,
}) => {
  const { colors, isLight } = useTheme();
  const { lang, requestOtp, verifyOtp, resetPassword } = useAuthStore();
  const t = AUTH_TRANSLATIONS[lang] || AUTH_TRANSLATIONS.EN;

  const [step, setStep] = useState<'PHONE' | 'OTP' | 'PASSWORD' | 'DONE'>('PHONE');
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);
  const [timer, setTimer] = useState(300);
  const [resetToken, setResetToken] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 5-minute countdown timer when on OTP step
  useEffect(() => {
    let interval: any = null;
    if (isOpen && step === 'OTP' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, step, timer]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('PHONE');
      setPhone(initialPhone);
      setOtp('');
      setErrorMsg('');
      setTimer(300);
    }
  }, [isOpen, initialPhone]);

  const handleRequestOtp = async () => {
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit registered mobile number');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await requestOtp(phone.trim(), 'PASSWORD_RESET');
      setSimulatedOtp(res.simulatedOtp || null);
      setTimer(res.expiresInSeconds || 300);
      setStep('OTP');
      setOtp('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send OTP. Please check your registered mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length < 6) {
      setErrorMsg('Please enter the 6-digit OTP code sent to your mobile');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await verifyOtp(phone.trim(), otp.trim(), 'PASSWORD_RESET');
      if (res?.resetToken) {
        setResetToken(res.resetToken);
        setStep('PASSWORD');
      } else {
        throw new Error('Verification failed. Invalid OTP.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid OTP code. Please enter the valid 6-digit code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPass || newPass.length < 6) {
      setErrorMsg('New password must be at least 6 characters long');
      return;
    }
    if (newPass !== confirmPass) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await resetPassword(resetToken, newPass);
      setStep('DONE');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Password reset failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.recovery.title}
      subtitle={t.recovery.subtitle}
      icon="🔑"
      iconBg="rgba(245, 158, 11, 0.15)"
      iconColor="#f59e0b"
      maxWidth={440}
    >
      <View style={styles.modalContent}>
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {/* Step 1: Phone */}
        {step === 'PHONE' && (
          <View style={styles.stepContainer}>
            <TextInput
              label={t.recovery.phoneLabel}
              placeholder={t.recovery.phonePlaceholder}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon="📱"
              required
            />
            <Text style={[styles.helpText, { color: colors.textMuted }]}>
              {t.recovery.phoneHelp}
            </Text>

            <Button
              title={loading ? t.recovery.sendingOtp : t.recovery.sendOtpBtn}
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              onPress={handleRequestOtp}
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        {/* Step 2: OTP */}
        {step === 'OTP' && (
          <View style={styles.stepContainer}>
            <View
              style={[
                styles.otpInfoBox,
                {
                  backgroundColor: isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.10)',
                  borderColor: isLight ? '#a7f3d0' : 'rgba(0, 212, 136, 0.30)',
                },
              ]}
            >
              <Text style={[styles.codeSentText, { color: colors.textSecondary }]}>
                {t.recovery.codeSentTo}{' '}
                <Text style={{ color: isLight ? '#047857' : '#00D488', fontWeight: '800' }}>
                  +91 {phone}
                </Text>
              </Text>

              {simulatedOtp && (
                <TouchableOpacity
                  onPress={() => setOtp(simulatedOtp)}
                  style={styles.autofillChip}
                  activeOpacity={0.7}
                >
                  <Text style={styles.autofillText}>
                    {t.recovery.testOtp} <Text style={{ fontWeight: '900' }}>{simulatedOtp}</Text> (Tap to fill)
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              label="6-DIGIT OTP CODE"
              placeholder="Enter 6-digit code"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              leftIcon="🔢"
              required
            />

            <View style={styles.otpTimerRow}>
              <TouchableOpacity onPress={() => setStep('PHONE')}>
                <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                  {t.recovery.changePhone}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.timerText, { color: colors.textMuted }]}>
                {t.recovery.expiresIn}{' '}
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </Text>
            </View>

            <Button
              title={loading ? t.recovery.verifyingOtp : t.recovery.verifyCodeBtn}
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              onPress={handleVerifyOtp}
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        {/* Step 3: Password */}
        {step === 'PASSWORD' && (
          <View style={styles.stepContainer}>
            <TextInput
              label={t.recovery.newPassLabel}
              placeholder={t.recovery.newPassPlaceholder}
              value={newPass}
              onChangeText={setNewPass}
              secureTextEntry
              leftIcon="🔒"
              required
            />

            <TextInput
              label={t.recovery.confirmPassLabel}
              placeholder={t.recovery.confirmPassPlaceholder}
              value={confirmPass}
              onChangeText={setConfirmPass}
              secureTextEntry
              leftIcon="🔒"
              required
            />

            <Button
              title={loading ? t.recovery.resetting : t.recovery.resetBtn}
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              onPress={handleResetPassword}
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        {/* Step 4: Done */}
        {step === 'DONE' && (
          <View style={styles.doneContainer}>
            <View style={styles.doneIconCircle}>
              <Text style={{ fontSize: 32 }}>🎉</Text>
            </View>
            <Text style={[styles.doneTitle, { color: colors.textPrimary }]}>
              Password Reset!
            </Text>
            <Text style={[styles.doneDesc, { color: colors.textSecondary }]}>
              {t.recovery.resetSuccess}
            </Text>

            <Button
              title="Back to Sign In ➔"
              variant="primary"
              size="lg"
              fullWidth
              onPress={onClose}
              style={{ marginTop: 16 }}
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
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
  stepContainer: {
    width: '100%',
  },
  helpText: {
    fontSize: 12,
    marginTop: -6,
    marginBottom: 12,
    lineHeight: 16,
  },
  otpInfoBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 14,
    alignItems: 'center',
    gap: 6,
  },
  codeSentText: {
    fontSize: 13,
  },
  autofillChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#00D488',
    borderRadius: 6,
  },
  autofillText: {
    color: '#020608',
    fontSize: 11,
    fontWeight: '700',
  },
  otpTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    marginTop: -4,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  doneContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  doneIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 212, 136, 0.15)',
    borderWidth: 1.5,
    borderColor: '#00D488',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  doneTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  doneDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
});

