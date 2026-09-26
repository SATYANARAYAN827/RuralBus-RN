import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useAuthStore } from '../../stores/auth.store';
import { AUTH_TRANSLATIONS } from '../../theme/i18n';
import { Card, Button, TextInput } from '../../components/common';
import { LanguageSelector } from '../../components/auth/LanguageSelectorModal';
import { ThemeToggle } from '../../components/layout/ThemeToggle';

export interface RegisterScreenProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: (phone: string) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onSwitchToLogin,
  onRegisterSuccess,
}) => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const { lang, register, requestOtp, verifyOtp, isLoading, error, clearError } = useAuthStore();
  const t = AUTH_TRANSLATIONS[lang] || AUTH_TRANSLATIONS.EN;

  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2 OTP State
  const [enteredOtp, setEnteredOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(30);
  const [localError, setLocalError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // 30-second countdown timer for registration OTP
  useEffect(() => {
    let interval: any = null;
    if (step === 'OTP' && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((s) => s - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  const handleSendOtp = async () => {
    if (!fullName.trim()) {
      setLocalError('Please enter your full name');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setLocalError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }

    setLocalError('');
    clearError();
    try {
      const res = await requestOtp(phone.trim(), 'REGISTRATION');
      setGeneratedOtp(res.simulatedOtp || '');
      setEnteredOtp('');
      setOtpTimer(res.expiresInSeconds || 30);
      setStep('OTP');
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to send verification OTP. Please try again.');
    }
  };

  const handleVerifyOtpAndRegister = async () => {
    if (!enteredOtp.trim() || enteredOtp.trim().length !== 6) {
      setLocalError('Please enter the 6-digit OTP code sent to your mobile.');
      return;
    }

    setLocalError('');
    setIsVerifying(true);
    try {
      // 1. Authoritative backend OTP verification
      await verifyOtp(phone.trim(), enteredOtp.trim(), 'REGISTRATION');

      // 2. Authoritative backend registration
      await register({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
        role: 'PASSENGER',
      });
      onRegisterSuccess(phone.trim());
    } catch (err: any) {
      setLocalError(err?.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        {
          padding: isMobile ? 16 : 24,
          alignItems: isMobile ? 'center' : 'flex-start',
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Floating Controls Bar */}
      <View style={styles.topBar}>
        <LanguageSelector compact={isMobile} />
        <ThemeToggle compact={isMobile} />
      </View>

      <View style={styles.cardWrapper}>
        <Card
          padding={isMobile ? 22 : 32}
          radius={24}
          variant={isLight ? 'elevated' : 'dark'}
          style={styles.card}
        >
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.appIconBox}>
              <Text style={{ fontSize: 24 }}>🚌</Text>
            </View>
            <Text style={[styles.brandTitle, { color: isLight ? '#0f172a' : '#ffffff' }]}>
              RURAL<Text style={{ color: isLight ? '#047857' : '#00D488' }}>BUS</Text>
            </Text>
            <Text style={[styles.brandSubtitle, { color: isLight ? '#475569' : '#94a3b8' }]}>
              {t.subtitle}
            </Text>
          </View>

          {/* Error Alert */}
          {(localError || error) ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {localError || error}</Text>
            </View>
          ) : null}

          {/* Step 1: Registration Form */}
          {step === 'FORM' && (
            <View style={styles.form}>
              <TextInput
                label={t.reg.fullNameLabel}
                placeholder={t.reg.fullNamePlaceholder}
                value={fullName}
                onChangeText={setFullName}
                leftIcon="👤"
                required
              />

              <TextInput
                label={t.reg.phoneLabel}
                placeholder={t.reg.phonePlaceholder}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                leftIcon="📱"
                required
              />

              <TextInput
                label={t.reg.emailLabel}
                placeholder={t.reg.emailPlaceholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="✉️"
              />

              <TextInput
                label={t.reg.createPasswordLabel}
                placeholder={t.reg.createPasswordPlaceholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon="🔒"
                required
              />

              <Button
                title={isLoading ? t.reg.sendingOtp : t.reg.sendOtp}
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                onPress={handleSendOtp}
                style={{ marginTop: 8 }}
              />

              <View style={styles.footerRow}>
                <Text style={{ fontSize: 13, color: isLight ? '#475569' : '#94a3b8' }}>
                  {t.reg.alreadyRegistered}{' '}
                </Text>
                <TouchableOpacity onPress={onSwitchToLogin}>
                  <Text style={[styles.loginLink, { color: isLight ? '#047857' : '#00D488' }]}>
                    {t.reg.signInLink}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'OTP' && (
            <View style={styles.form}>
              <View
                style={[
                  styles.otpSentBox,
                  {
                    backgroundColor: isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.08)',
                    borderColor: isLight ? '#a7f3d0' : 'rgba(0, 212, 136, 0.25)',
                  },
                ]}
              >
                <Text style={[styles.otpSentTitle, { color: isLight ? '#047857' : '#00D488' }]}>
                  {t.reg.otpSentTo}
                </Text>
                <Text style={[styles.otpPhoneText, { color: isLight ? '#0f172a' : '#ffffff' }]}>
                  +91 {phone}
                </Text>

                {generatedOtp ? (
                  <TouchableOpacity
                    onPress={() => setEnteredOtp(generatedOtp)}
                    style={styles.autofillBadge}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.autofillBadgeText}>
                      {t.reg.autofillCode} <Text style={{ fontWeight: '900' }}>{generatedOtp}</Text>
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <TextInput
                label="6-DIGIT VERIFICATION CODE"
                placeholder={t.reg.enterCode}
                value={enteredOtp}
                onChangeText={setEnteredOtp}
                keyboardType="number-pad"
                leftIcon="🔢"
                required
              />

              <View style={styles.resendRow}>
                <TouchableOpacity onPress={() => setStep('FORM')}>
                  <Text style={[styles.linkText, { color: isLight ? '#475569' : '#94a3b8' }]}>
                    {t.reg.editPhone}
                  </Text>
                </TouchableOpacity>

                {otpTimer > 0 ? (
                  <Text style={{ fontSize: 12, color: isLight ? '#64748b' : '#94a3b8' }}>
                    {t.reg.resendIn} {otpTimer}s
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      requestOtp(phone, 'REGISTRATION');
                      setOtpTimer(30);
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: isLight ? '#047857' : '#00D488' }}>
                      {t.reg.resendCode}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <Button
                title={isVerifying ? t.reg.creatingAccount : t.reg.verifyAndRegister}
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isVerifying}
                onPress={handleVerifyOtpAndRegister}
                style={{ marginTop: 8 }}
              />
            </View>
          )}
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
  },
  topBar: {
    position: 'absolute',
    top: 20,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 100,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 440,
    marginTop: 60,
  },
  card: {
    width: '100%',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#00D488',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorBanner: {
    padding: 10,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderColor: 'rgba(225, 29, 72, 0.35)',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#e11d48',
    fontSize: 12,
    fontWeight: '700',
  },
  form: {
    width: '100%',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  otpSentBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 14,
    alignItems: 'center',
    gap: 4,
  },
  otpSentTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  otpPhoneText: {
    fontSize: 16,
    fontWeight: '900',
  },
  autofillBadge: {
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#00D488',
    borderRadius: 6,
  },
  autofillBadgeText: {
    color: '#020608',
    fontSize: 11,
    fontWeight: '700',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: -4,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

