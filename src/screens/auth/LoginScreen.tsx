import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useAuthStore } from '../../stores/auth.store';
import { useNavigationStore } from '../../navigation/navigation.store';
import { AUTH_TRANSLATIONS } from '../../theme/i18n';
import { Card, Button, TextInput } from '../../components/common';
import { LanguageSelector } from '../../components/auth/LanguageSelectorModal';
import { ThemeToggle } from '../../components/layout/ThemeToggle';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { ForceChangePasswordModal } from './ForceChangePasswordModal';
import { UserRole } from '../../types';

export interface LoginScreenProps {
  onSwitchToRegister: () => void;
}

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
  const [rememberMe, setRememberMe] = useState(true);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [showQuickLogins, setShowQuickLogins] = useState(false);

  const handleLoginSubmit = async () => {
    if (!identifier.trim()) {
      return;
    }
    clearError();
    try {
      await login(identifier, password, rememberMe);
      // Synchronize with navigation state
      const loggedUser = useAuthStore.getState().user;
      if (loggedUser) {
        navigationStore.login(loggedUser.role);
      }
    } catch {
      // Error handled by store state
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    // In production builds: strictly no hardcoded credentials, mock JWTs, or auth bypass.
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    // In development / test environment only:
    try {
      loginAsDemoRole(role);
      navigationStore.setActiveRole(role);
      navigationStore.login(role);
    } catch {
      // Ignore if demo login is unavailable
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isLight ? '#0f172a' : '#050a0f' },
      ]}
    >
      {/* Background Image Overlay */}
      <ImageBackground
        source={require('../../../assets/images/odisha_highway_bg.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View
          style={[
            styles.darkOverlay,
            {
              backgroundColor: isLight
                ? 'rgba(15, 23, 42, 0.45)'
                : 'rgba(5, 10, 15, 0.75)',
            },
          ]}
        >
          {/* Top Floating Controls Bar */}
          <View style={styles.topBar}>
            <LanguageSelector compact={isMobile} />
            <ThemeToggle compact={isMobile} />
          </View>

          {/* Scrollable Content Container */}
          <ScrollView
            contentContainerStyle={[
              styles.scrollContainer,
              {
                padding: isMobile ? 16 : 36,
                alignItems: isMobile ? 'center' : 'flex-start',
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cardWrapper}>
              <Card
                padding={isMobile ? 22 : 34}
                radius={28}
                variant={isLight ? 'elevated' : 'dark'}
                style={[
                  styles.card,
                  {
                    backgroundColor: isLight
                      ? 'rgba(255, 255, 255, 0.98)'
                      : 'rgba(15, 23, 42, 0.92)',
                    borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)',
                  },
                ]}
              >
                {/* Brand Header */}
                <View style={styles.brandHeader}>
                  <View style={styles.appIconBox}>
                    <Text style={{ fontSize: 26 }}>🚌</Text>
                  </View>
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

                {/* Form Fields */}
                <View style={styles.form}>
                  <TextInput
                    label={t.userIdLabel}
                    placeholder={t.userIdPlaceholder}
                    value={identifier}
                    onChangeText={setIdentifier}
                    leftIcon="👤"
                    required
                  />

                  <TextInput
                    label={t.passwordLabel}
                    placeholder={t.passwordPlaceholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    leftIcon="🔒"
                    required
                  />

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
                            backgroundColor: rememberMe
                              ? '#00D488'
                              : 'transparent',
                            borderColor: rememberMe
                              ? '#00D488'
                              : isLight
                              ? '#cbd5e1'
                              : '#475569',
                          },
                        ]}
                      >
                        {rememberMe && (
                          <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '900' }}>✓</Text>
                        )}
                      </View>
                      <Text style={[styles.rememberMeLabel, { color: isLight ? '#334155' : '#cbd5e1' }]}>
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

                  {/* Sign In CTA */}
                  <Button
                    title={isLoading ? t.authenticating : t.signIn}
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isLoading}
                    iconRight="➔"
                    onPress={handleLoginSubmit}
                    style={{ marginTop: 8, minHeight: 48 }}
                  />

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
              </Card>
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
        isOpen={Boolean(user?.mustChangePassword)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 440,
    marginTop: 50,
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
  rememberForgotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: -4,
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

