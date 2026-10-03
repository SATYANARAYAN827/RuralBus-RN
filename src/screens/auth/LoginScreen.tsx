import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useAuthStore } from '../../stores/auth.store';
import { useNavigationStore } from '../../navigation/navigation.store';
import { AUTH_TRANSLATIONS } from '../../theme/i18n';
import { LanguageSelector } from '../../components/auth/LanguageSelectorModal';
import { ThemeToggle } from '../../components/layout/ThemeToggle';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { ForceChangePasswordModal } from './ForceChangePasswordModal';
import { UserRole } from '../../types';

export interface LoginScreenProps {
  onSwitchToRegister: () => void;
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

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSwitchToRegister }) => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    user,
    lang,
    login,
    loginAsDemoRole,
    isLoading,
    error,
    clearError,
  } = useAuthStore();

  const navigationStore = useNavigationStore();
  const t = AUTH_TRANSLATIONS[lang] || AUTH_TRANSLATIONS.EN;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [showQuickLogins, setShowQuickLogins] = useState(false);
  const [isForcePasswordDismissed, setIsForcePasswordDismissed] = useState(false);

  const handleLoginSubmit = async () => {
    if (!identifier.trim()) {
      return;
    }
    clearError();
    try {
      await login(identifier, password, rememberMe);
      const loggedUser = useAuthStore.getState().user;
      if (loggedUser) {
        navigationStore.setActiveRole(loggedUser.role, loggedUser);
        navigationStore.login(loggedUser.role, loggedUser);
      }
    } catch {
      // Error handled by store state
    }
  };

  const DEMO_CREDENTIALS: Record<UserRole, { phone: string; pass: string }> = {
    PLATFORM_ADMIN: { phone: '9876500000', pass: 'Password123!' },
    OPERATOR_ADMIN: { phone: '9861465410', pass: 'Password123!' },
    DRIVER: { phone: '9876543202', pass: 'Password123!' },
    CONDUCTOR: { phone: '9876543203', pass: 'Password123!' },
    PASSENGER: { phone: '7381319957', pass: 'Password123!' },
  };

  const handleQuickLogin = async (role: UserRole) => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    const cred = DEMO_CREDENTIALS[role];
    if (!cred) return;

    setIdentifier(cred.phone);
    setPassword(cred.pass);
    clearError();

    try {
      await login(cred.phone, cred.pass, true);
      const loggedUser = useAuthStore.getState().user;
      if (loggedUser) {
        navigationStore.setActiveRole(loggedUser.role, loggedUser);
        navigationStore.login(loggedUser.role, loggedUser);
      }
    } catch {
      // Fallback only if backend is unreachable in offline dev
      try {
        loginAsDemoRole(role);
        navigationStore.setActiveRole(role);
        navigationStore.login(role);
      } catch {}
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
                {error ? (
                  <View style={styles.errorBanner}>
                    <View style={styles.errorRow}>
                      <Text style={styles.errorText}>⚠️ {error}</Text>
                      <TouchableOpacity onPress={clearError}>
                        <Text style={{ color: '#e11d48', fontWeight: '900', fontSize: 14 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {/* Form Inputs */}
                <View style={styles.form}>
                  {/* Field 1: Mobile Number / User ID */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: isLight ? '#1e293b' : '#cbd5e1' }]}>
                      {t.userIdLabel}
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
                        value={identifier}
                        onChangeText={setIdentifier}
                        placeholder={t.userIdPlaceholder}
                        placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        autoComplete="off"
                        textContentType="none"
                        style={[
                          styles.textInput,
                          { color: isLight ? '#0f172a' : '#ffffff' },
                        ]}
                      />
                      {identifier ? (
                        <TouchableOpacity onPress={() => setIdentifier('')} style={styles.clearBtn}>
                          <Text style={{ color: '#94a3b8', fontSize: 13 }}>✕</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>

                  {/* Field 2: Password */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: isLight ? '#1e293b' : '#cbd5e1' }]}>
                      {t.passwordLabel}
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
                      <Text style={[styles.inputIcon, { color: isLight ? '#f59e0b' : '#fbbf24' }]}>🔒</Text>
                      <RNTextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder={t.passwordPlaceholder}
                        placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        autoComplete="new-password"
                        textContentType="none"
                        style={[
                          styles.textInput,
                          { color: isLight ? '#0f172a' : '#ffffff' },
                        ]}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Remember Me & Forgot Password Row */}
                  <View style={styles.rememberForgotRow}>
                    <TouchableOpacity
                      onPress={() => setRememberMe(!rememberMe)}
                      style={styles.rememberMeBtn}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: rememberMe ? '#00D488' : 'transparent',
                            borderColor: rememberMe ? '#00D488' : isLight ? '#cbd5e1' : '#475569',
                          },
                        ]}
                      >
                        {rememberMe && (
                          <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '900' }}>✓</Text>
                        )}
                      </View>
                      <Text style={[styles.rememberMeLabel, { color: isLight ? '#1e293b' : '#cbd5e1' }]}>
                        {t.rememberMe}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setIsForgotModalOpen(true)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.forgotPassLink,
                          { color: isLight ? '#047857' : '#00D488' },
                        ]}
                      >
                        {t.forgotPassword}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Sign In CTA Button */}
                  <TouchableOpacity
                    onPress={handleLoginSubmit}
                    disabled={isLoading}
                    activeOpacity={0.9}
                    style={[
                      styles.signInBtn,
                      { opacity: isLoading ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={styles.signInBtnText}>
                      {isLoading ? t.authenticating : t.signIn}{' '}
                      <Text style={{ fontSize: 16 }}>➔</Text>
                    </Text>
                  </TouchableOpacity>

                  {/* Switch to Registration */}
                  <View style={styles.switchRegRow}>
                    <Text style={{ fontSize: 13, color: isLight ? '#475569' : '#94a3b8' }}>
                      {t.newCommuter}{' '}
                    </Text>
                    <TouchableOpacity onPress={onSwitchToRegister}>
                      <Text style={[styles.createAccountLink, { color: isLight ? '#047857' : '#00D488' }]}>
                        {t.createAccount}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* First-Time Login Hint */}
                  <Text style={[styles.firstTimeHint, { color: isLight ? '#64748b' : '#94a3b8' }]}>
                    First time? Use the temporary password sent to your mobile via SMS.
                  </Text>

                  {/* Quick Evaluation Logins Section (Development & Test Tooling Only) */}
                  {process.env.NODE_ENV !== 'production' && (
                    <View style={styles.quickLoginsSection}>
                      <TouchableOpacity
                        onPress={() => setShowQuickLogins(!showQuickLogins)}
                        style={styles.quickLoginsToggle}
                      >
                        <Text
                          style={[
                            styles.quickLoginsTitle,
                            { color: isLight ? '#475569' : '#94a3b8' },
                          ]}
                        >
                          {t.quickLogins} {showQuickLogins ? '▴' : '▾'}
                        </Text>
                      </TouchableOpacity>

                      {showQuickLogins && (
                        <View style={styles.quickLoginsGrid}>
                          {(
                            [
                              { role: 'PASSENGER', label: t.roles.passenger, icon: '👤' },
                              { role: 'DRIVER', label: t.roles.driver, icon: '🚌' },
                              { role: 'CONDUCTOR', label: t.roles.conductor, icon: '🎫' },
                              { role: 'OPERATOR_ADMIN', label: t.roles.owner, icon: '🏢' },
                              { role: 'PLATFORM_ADMIN', label: t.roles.admin, icon: '⚡' },
                            ] as const
                          ).map((item) => (
                            <TouchableOpacity
                              key={item.role}
                              onPress={() => handleQuickLogin(item.role)}
                              style={[
                                styles.quickRolePill,
                                {
                                  backgroundColor: isLight
                                    ? '#f1f5f9'
                                    : 'rgba(255, 255, 255, 0.08)',
                                  borderColor: isLight
                                    ? '#cbd5e1'
                                    : 'rgba(255, 255, 255, 0.15)',
                                },
                              ]}
                            >
                              <Text style={{ fontSize: 13 }}>{item.icon}</Text>
                              <Text
                                style={[
                                  styles.quickRoleText,
                                  { color: isLight ? '#0f172a' : '#ffffff' },
                                ]}
                              >
                                {item.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>

      {/* Account Recovery Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        initialPhone={identifier}
      />

      {/* Force Password Change Modal (Shown if user mustChangePassword === true) */}
      <ForceChangePasswordModal
        isOpen={Boolean(user?.mustChangePassword && !isForcePasswordDismissed)}
        onClose={() => setIsForcePasswordDismissed(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#020608',
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
    width: '100%',
    paddingVertical: 36,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 440,
  },
  card: {
    width: '100%',
    borderRadius: 32,
    paddingHorizontal: 32,
    paddingVertical: 36,
  },
  appIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#00D488',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
    // @ts-ignore
    boxShadow: '0 4px 20px rgba(0, 212, 136, 0.35)',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
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
  rememberForgotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 2,
  },
  rememberMeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberMeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  forgotPassLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  signInBtn: {
    marginTop: 6,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#00a86b',
    // @ts-ignore
    boxShadow: '0 6px 24px rgba(0, 184, 122, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  switchRegRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  createAccountLink: {
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  firstTimeHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  quickLoginsSection: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.20)',
    alignItems: 'center',
  },
  quickLoginsToggle: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  quickLoginsTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  quickLoginsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 10,
  },
  quickRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickRoleText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
