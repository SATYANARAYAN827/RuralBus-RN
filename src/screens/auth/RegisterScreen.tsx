import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useAuthStore } from '../../stores/auth.store';
import { AUTH_TRANSLATIONS } from '../../theme/i18n';
import { LanguageSelector } from '../../components/auth/LanguageSelectorModal';
import { ThemeToggle } from '../../components/layout/ThemeToggle';

export interface RegisterScreenProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: (phone: string) => void;
}

/**
 * Line-art bus SVG matching the signature brand icon in Golden Reference
 */
const BusIcon: React.FC = () => {
  if (Platform.OS === 'web') {
    return React.createElement(
      'svg',
      {
        width: 28,
        height: 28,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: '#ffffff',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
      React.createElement('path', { d: 'M8 6v6' }),
      React.createElement('path', { d: 'M15 6v6' }),
      React.createElement('path', { d: 'M2 12h19.6' }),
      React.createElement('path', {
        d: 'M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.6-.1-1.1-.3-1.6L20 6.6C19.5 5 18 4 16.3 4H7.7C6 4 4.5 5 4 6.6L2.3 12.4c-.2.5-.3 1-.3 1.6 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3',
      }),
      React.createElement('circle', { cx: 7, cy: 18, r: 2 }),
      React.createElement('path', { d: 'M9 18h5' }),
      React.createElement('circle', { cx: 16, cy: 18, r: 2 })
    );
  }
  return <Text style={{ fontSize: 26, color: '#ffffff' }}>🚌</Text>;
};

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
  const [showPassword, setShowPassword] = useState(false);

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
    const cleanPhone = phone.replace(/\D/g, '');
    if (!fullName.trim()) {
      setLocalError('Please enter your full name');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
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
      const res = await requestOtp(cleanPhone.slice(-10), 'REGISTRATION');
      const otpCode = res.simulatedOtp || '';
      setGeneratedOtp(otpCode);
      // Auto-fill OTP in demo/test mode so user can verify with single tap
      if (otpCode) {
        setEnteredOtp(otpCode);
      } else {
        setEnteredOtp('');
      }
      setOtpTimer(res.expiresInSeconds ? Math.min(res.expiresInSeconds, 30) : 30);
      setStep('OTP');
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to send verification OTP. Please try again.');
    }
  };

  const handleVerifyOtpAndRegister = async () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!enteredOtp.trim() || enteredOtp.trim().length !== 6) {
      setLocalError('Please enter the 6-digit OTP code sent to your mobile.');
      return;
    }

    setLocalError('');
    setIsVerifying(true);
    try {
      // 1. Authoritative backend OTP verification
      await verifyOtp(cleanPhone, enteredOtp.trim(), 'REGISTRATION');

      // 2. Authoritative backend registration
      await register({
        fullName: fullName.trim(),
        phone: cleanPhone,
        email: email.trim() || undefined,
        password,
        role: 'PASSENGER',
      });
      onRegisterSuccess(cleanPhone);
    } catch (err: any) {
      setLocalError(err?.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    setLocalError('');
    try {
      const res = await requestOtp(cleanPhone, 'REGISTRATION');
      if (res.simulatedOtp) {
        setGeneratedOtp(res.simulatedOtp);
        setEnteredOtp(res.simulatedOtp);
      }
      setOtpTimer(30);
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to resend verification OTP.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Signature Reference Background Image */}
      <ImageBackground
        source={require('../../../assets/images/ruralbus_reference_bg.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: isLight ? 'transparent' : 'rgba(5, 10, 15, 0.45)',
            },
          ]}
        >
          {/* Top Floating Controls Bar */}
          <View style={[styles.topBar, { right: isMobile ? 16 : 36 }]}>
            <LanguageSelector compact={isMobile} />
            <ThemeToggle compact={isMobile} />
          </View>

          {/* Scrollable Content Container (Left-Aligned on Desktop, Centered on Mobile) */}
          <ScrollView
            contentContainerStyle={[
              styles.scrollContainer,
              {
                paddingLeft: isMobile ? 16 : 80,
                paddingRight: isMobile ? 16 : 80,
                alignItems: isMobile ? 'center' : 'flex-start',
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cardContainer}>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isLight ? '#ffffff' : 'rgba(10, 18, 22, 0.92)',
                    borderColor: isLight ? 'transparent' : 'rgba(255, 255, 255, 0.12)',
                    borderWidth: isLight ? 0 : 1,
                    // @ts-ignore
                    boxShadow: isLight
                      ? '0 24px 60px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(0, 0, 0, 0.06)'
                      : '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(0, 212, 136, 0.08)',
                  },
                ]}
              >
                {/* Signature Brand Icon Box */}
                <View style={styles.appIconBox}>
                  <BusIcon />
                </View>

                {/* Two-Tone Brand Title */}
                <View style={styles.brandHeader}>
                  <Text style={[styles.brandTitle, { color: isLight ? '#0f172a' : '#ffffff' }]}>
                    RURAL<Text style={{ color: isLight ? '#047857' : '#00D488' }}>BUS</Text>
                  </Text>
                  <Text style={[styles.brandSubtitle, { color: isLight ? '#475569' : '#94a3b8' }]}>
                    {t.subtitle}
                  </Text>
                </View>

                {/* Error Banner */}
                {(localError || error) ? (
                  <View style={styles.errorBanner}>
                    <View style={styles.errorRow}>
                      <Text style={styles.errorText}>⚠️ {localError || error}</Text>
                      <TouchableOpacity onPress={() => { setLocalError(''); clearError(); }}>
                        <Text style={{ color: '#e11d48', fontWeight: '900', fontSize: 14 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {/* STEP 1: REGISTRATION FORM */}
                {step === 'FORM' && (
                  <View style={styles.form}>
                    {/* Field 1: Full Name */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: isLight ? '#1e293b' : '#cbd5e1' }]}>
                        {t.reg.fullNameLabel} <Text style={{ color: '#e11d48' }}>*</Text>
                      </Text>
                      <View
                        style={[
                          styles.inputContainer,
                          {
                            backgroundColor: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.7)',
                            borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.16)',
                          },
                        ]}
                      >
                        <Text style={[styles.inputIcon, { color: isLight ? '#6366f1' : '#818cf8' }]}>👤</Text>
                        <RNTextInput
                          value={fullName}
                          onChangeText={setFullName}
                          placeholder={t.reg.fullNamePlaceholder}
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          style={[styles.textInput, { color: isLight ? '#0f172a' : '#ffffff' }]}
                        />
                        {fullName ? (
                          <TouchableOpacity onPress={() => setFullName('')} style={styles.clearBtn}>
                            <Text style={{ color: '#94a3b8', fontSize: 13 }}>✕</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>

                    {/* Field 2: Mobile Number */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: isLight ? '#1e293b' : '#cbd5e1' }]}>
                        {t.reg.phoneLabel} <Text style={{ color: '#e11d48' }}>*</Text>
                      </Text>
                      <View
                        style={[
                          styles.inputContainer,
                          {
                            backgroundColor: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.7)',
                            borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.16)',
                          },
                        ]}
                      >
                        <Text style={[styles.inputIcon, { color: isLight ? '#047857' : '#00D488' }]}>📱</Text>
                        <RNTextInput
                          value={phone}
                          onChangeText={setPhone}
                          placeholder={t.reg.phonePlaceholder}
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          keyboardType="phone-pad"
                          style={[styles.textInput, { color: isLight ? '#0f172a' : '#ffffff' }]}
                        />
                        {phone ? (
                          <TouchableOpacity onPress={() => setPhone('')} style={styles.clearBtn}>
                            <Text style={{ color: '#94a3b8', fontSize: 13 }}>✕</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>

                    {/* Field 3: Email Address (Optional) */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: isLight ? '#1e293b' : '#cbd5e1' }]}>
                        {t.reg.emailLabel}
                      </Text>
                      <View
                        style={[
                          styles.inputContainer,
                          {
                            backgroundColor: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.7)',
                            borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.16)',
                          },
                        ]}
                      >
                        <Text style={[styles.inputIcon, { color: isLight ? '#0284c7' : '#38bdf8' }]}>✉️</Text>
                        <RNTextInput
                          value={email}
                          onChangeText={setEmail}
                          placeholder={t.reg.emailPlaceholder}
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          style={[styles.textInput, { color: isLight ? '#0f172a' : '#ffffff' }]}
                        />
                        {email ? (
                          <TouchableOpacity onPress={() => setEmail('')} style={styles.clearBtn}>
                            <Text style={{ color: '#94a3b8', fontSize: 13 }}>✕</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>

                    {/* Field 4: Create Password */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: isLight ? '#1e293b' : '#cbd5e1' }]}>
                        {t.reg.createPasswordLabel} <Text style={{ color: '#e11d48' }}>*</Text>
                      </Text>
                      <View
                        style={[
                          styles.inputContainer,
                          {
                            backgroundColor: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.7)',
                            borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.16)',
                          },
                        ]}
                      >
                        <Text style={[styles.inputIcon, { color: isLight ? '#d97706' : '#fbbf24' }]}>🔒</Text>
                        <RNTextInput
                          value={password}
                          onChangeText={setPassword}
                          placeholder={t.reg.createPasswordPlaceholder}
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          style={[styles.textInput, { color: isLight ? '#0f172a' : '#ffffff' }]}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeBtn}
                        >
                          <Text style={{ fontSize: 14 }}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[
                        styles.submitBtn,
                        { opacity: isLoading ? 0.7 : 1 },
                      ]}
                      onPress={handleSendOtp}
                      disabled={isLoading}
                      activeOpacity={0.85}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.submitBtnText}>
                          {t.reg.sendOtp} →
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* Switch to Login Link */}
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

                {/* STEP 2: OTP VERIFICATION */}
                {step === 'OTP' && (
                  <View style={styles.form}>
                    {/* Sent Confirmation Box */}
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
                        +91 {phone.replace(/\D/g, '').slice(-10)}
                      </Text>

                      {/* Auto-fill & Displayed OTP Banner */}
                      {generatedOtp ? (
                        <TouchableOpacity
                          onPress={() => setEnteredOtp(generatedOtp)}
                          style={styles.autofillBadge}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.autofillBadgeText}>
                            ⚡ {t.reg.autofillCode || 'Test OTP'}: <Text style={{ fontWeight: '900', letterSpacing: 1 }}>{generatedOtp}</Text> (Tap to Fill)
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {/* OTP 6-Digit Input */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: isLight ? '#1e293b' : '#cbd5e1' }]}>
                        6-DIGIT VERIFICATION CODE <Text style={{ color: '#e11d48' }}>*</Text>
                      </Text>
                      <View
                        style={[
                          styles.inputContainer,
                          {
                            backgroundColor: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.7)',
                            borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.16)',
                          },
                        ]}
                      >
                        <Text style={[styles.inputIcon, { color: isLight ? '#047857' : '#00D488' }]}>🔐</Text>
                        <RNTextInput
                          value={enteredOtp}
                          onChangeText={setEnteredOtp}
                          placeholder={t.reg.enterCode || 'Enter 6-digit code'}
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          keyboardType="number-pad"
                          maxLength={6}
                          style={[
                            styles.textInput,
                            {
                              color: isLight ? '#0f172a' : '#ffffff',
                              letterSpacing: enteredOtp ? 4 : 0,
                              fontWeight: '700',
                            },
                          ]}
                        />
                        {enteredOtp ? (
                          <TouchableOpacity onPress={() => setEnteredOtp('')} style={styles.clearBtn}>
                            <Text style={{ color: '#94a3b8', fontSize: 13 }}>✕</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>

                    {/* Resend & Edit Phone Row */}
                    <View style={styles.resendRow}>
                      <TouchableOpacity onPress={() => setStep('FORM')}>
                        <Text style={[styles.linkText, { color: isLight ? '#475569' : '#94a3b8' }]}>
                          ← {t.reg.editPhone}
                        </Text>
                      </TouchableOpacity>

                      {otpTimer > 0 ? (
                        <Text style={{ fontSize: 12, color: isLight ? '#64748b' : '#94a3b8' }}>
                          {t.reg.resendIn} {otpTimer}s
                        </Text>
                      ) : (
                        <TouchableOpacity onPress={handleResendOtp}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: isLight ? '#047857' : '#00D488' }}>
                            {t.reg.resendCode}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Verify & Create Account Button */}
                    <TouchableOpacity
                      style={[
                        styles.submitBtn,
                        { opacity: isVerifying ? 0.7 : 1 },
                      ]}
                      onPress={handleVerifyOtpAndRegister}
                      disabled={isVerifying}
                      activeOpacity={0.85}
                    >
                      {isVerifying ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.submitBtnText}>
                          {t.reg.verifyAndRegister} →
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* Switch to Login Link */}
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
              </View>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: Platform.OS === 'web' ? ('100vh' as any) : undefined,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    top: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 100,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
    width: '100%',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 440,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    width: '100%',
  },
  appIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#00D488',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    // @ts-ignore
    boxShadow: '0 8px 20px rgba(0, 212, 136, 0.40)',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 28,
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
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#e11d48',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 15,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    height: '100%',
    paddingVertical: 0,
    // @ts-ignore
    outlineWidth: 0,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 4,
  },
  submitBtn: {
    marginTop: 6,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#00a86b',
    // @ts-ignore
    boxShadow: '0 6px 24px rgba(0, 184, 122, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
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
    marginBottom: 16,
    alignItems: 'center',
    gap: 4,
  },
  otpSentTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  otpPhoneText: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  autofillBadge: {
    marginTop: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: '#00D488',
    borderRadius: 8,
    // @ts-ignore
    boxShadow: '0 4px 12px rgba(0, 212, 136, 0.35)',
  },
  autofillBadgeText: {
    color: '#020608',
    fontSize: 12,
    fontWeight: '700',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: -4,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
