import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme';
import { Card, Button, Badge } from '../../components/common';
import { useAuthStore } from '../../stores/auth.store';
import { usePassengerStore } from '../../stores/passenger.store';

interface PassengerProfileScreenProps {
  onLogout: () => void;
  onOpenStopsModal: () => void;
  onOpenLanguageModal: () => void;
  onOpenThemeModal: () => void;
  onOpenSosModal: () => void;
  onOpenConsentModal: () => void;
}

export const PassengerProfileScreen: React.FC<PassengerProfileScreenProps> = ({
  onLogout,
  onOpenStopsModal,
  onOpenLanguageModal,
  onOpenThemeModal,
  onOpenSosModal,
  onOpenConsentModal,
}) => {
  const { colors, isLight } = useTheme();
  const authStore = useAuthStore();
  const user = authStore.user;

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [supportAlertOpen, setSupportAlertOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);

  const phone = user?.phone || '7381319957';
  const fullName = user?.fullName || 'Passenger';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.headerSection}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          My Account & Profile
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage commuter profile, language, SOS & account settings
        </Text>
      </View>

      {/* Profile Overview Card */}
      <Card padding={18} style={styles.profileOverviewCard}>
        <View style={styles.profileTopRow}>
          <View style={styles.avatarRing}>
            <Text style={styles.avatarChar}>{fullName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>
              {fullName}
            </Text>
            <Text style={[styles.profilePhone, { color: colors.textSecondary }]}>
              {phone}
            </Text>
            <View style={{ marginTop: 4 }}>
              <Badge variant="mint" label="50% completed" />
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setIsEditingProfile(!isEditingProfile)}
            style={[
              styles.completeBtn,
              {
                backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
                borderColor: isLight ? '#cbd5e1' : '#475569',
              },
            ]}
          >
            <Text style={[styles.completeBtnText, { color: colors.textPrimary }]}>
              Complete ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Set up profile in under 2 mins */}
        <TouchableOpacity
          onPress={() => setIsEditingProfile(!isEditingProfile)}
          style={[
            styles.setupBanner,
            {
              backgroundColor: isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.08)',
              borderColor: '#a7f3d0',
            },
          ]}
        >
          <Text style={{ fontSize: 18 }}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.setupTitle, { color: '#047857' }]}>
              Set up profile in under 2 mins
            </Text>
            <Text style={[styles.setupSub, { color: colors.textSecondary }]}>
              Add age and gender for faster checkout and emergency manifest
            </Text>
          </View>
          <Text style={{ fontSize: 16, color: '#00D488' }}>➔</Text>
        </TouchableOpacity>

        {isEditingProfile && (
          <View style={styles.kycSection}>
            <Text style={[styles.kycTitle, { color: colors.textSecondary }]}>
              COMMUTER VERIFICATION DETAILS
            </Text>
            <View style={styles.kycRow}>
              <Text style={[styles.kycLabel, { color: colors.textMuted }]}>
                Phone Verification:
              </Text>
              <Badge variant="success" label="VERIFIED (OTP Auth)" />
            </View>
            <View style={styles.kycRow}>
              <Text style={[styles.kycLabel, { color: colors.textMuted }]}>
                Identity Role:
              </Text>
              <Badge variant="neutral" label="PASSENGER (Commuter)" />
            </View>
            <View style={styles.kycRow}>
              <Text style={[styles.kycLabel, { color: colors.textMuted }]}>
                Emergency Contact:
              </Text>
              <Text style={[styles.kycVal, { color: colors.textPrimary }]}>
                Configured via SOS 112
              </Text>
            </View>
          </View>
        )}
      </Card>

      {/* Utility Menu Roster */}
      <Card padding={8} style={styles.utilitiesCard}>
        {/* 1. Bus stops near me */}
        <TouchableOpacity
          onPress={onOpenStopsModal}
          style={[styles.menuItem, { borderBottomColor: isLight ? '#f1f5f9' : '#1e293b' }]}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#fee2e2' }]}>
            <Text style={{ fontSize: 16 }}>📍</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
              Bus stops near me
            </Text>
            <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
              Active transit stops in your area
            </Text>
          </View>
          <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>

        {/* 2. Change language */}
        <TouchableOpacity
          onPress={onOpenLanguageModal}
          style={[styles.menuItem, { borderBottomColor: isLight ? '#f1f5f9' : '#1e293b' }]}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#e0f2fe' }]}>
            <Text style={{ fontSize: 16 }}>🌐</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
              Change language
            </Text>
            <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
              English (EN)
            </Text>
          </View>
          <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>

        {/* 3. Themes */}
        <TouchableOpacity
          onPress={onOpenThemeModal}
          style={[styles.menuItem, { borderBottomColor: isLight ? '#f1f5f9' : '#1e293b' }]}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#fef3c7' }]}>
            <Text style={{ fontSize: 16 }}>☀️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
              Themes
            </Text>
            <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
              {isLight ? 'Light Mode (Active)' : 'Dark Mode (Active)'}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>

        {/* 4. SOS */}
        <TouchableOpacity
          onPress={onOpenSosModal}
          style={[styles.menuItem, { borderBottomColor: isLight ? '#f1f5f9' : '#1e293b' }]}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#fee2e2' }]}>
            <Text style={{ fontSize: 16 }}>🚨</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
              SOS
            </Text>
            <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
              Direct dial National Emergency 112 & Helpline
            </Text>
          </View>
          <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>

        {/* 5. Customer support */}
        <TouchableOpacity
          onPress={() => setSupportAlertOpen(!supportAlertOpen)}
          style={[styles.menuItem, { borderBottomColor: isLight ? '#f1f5f9' : '#1e293b' }]}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#f1f5f9' }]}>
            <Text style={{ fontSize: 16 }}>🎧</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
              Customer support
            </Text>
            <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
              Helpdesk & transit assistance
            </Text>
          </View>
          <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>

        {supportAlertOpen && (
          <View style={[styles.expandableBox, { backgroundColor: isLight ? '#f8fafc' : '#1e293b' }]}>
            <Text style={[styles.supportPhone, { color: '#047857' }]}>
              📞 24×7 State Transit Toll-Free: 1800-345-6789
            </Text>
            <Text style={[styles.supportEmail, { color: colors.textSecondary }]}>
              ✉️ Email Helpdesk: support@ruralbus.odisha.gov.in
            </Text>
          </View>
        )}

        {/* 6. Manage Consent */}
        <TouchableOpacity
          onPress={onOpenConsentModal}
          style={[styles.menuItem, { borderBottomColor: isLight ? '#f1f5f9' : '#1e293b' }]}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#eff6ff' }]}>
            <Text style={{ fontSize: 16 }}>🛡️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
              Manage Consent
            </Text>
            <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
              Data privacy & telemetry preferences
            </Text>
          </View>
          <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>

        {/* 7. Account settings */}
        <TouchableOpacity
          onPress={() => setAccountSettingsOpen(!accountSettingsOpen)}
          style={styles.menuItem}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#f1f5f9' }]}>
            <Text style={{ fontSize: 16 }}>⚙️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
              Account settings
            </Text>
            <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
              App version, session & log out
            </Text>
          </View>
          <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>

        {accountSettingsOpen && (
          <View style={[styles.expandableBox, { backgroundColor: isLight ? '#f8fafc' : '#1e293b' }]}>
            <Text style={[styles.versionText, { color: colors.textPrimary }]}>
              RuralBus React Native Client v0.1.0 (Module 3 Baseline)
            </Text>
            <Text style={[styles.versionSub, { color: colors.textMuted }]}>
              Connected Backend: Fastify 5 REST API (Port 4000)
            </Text>
          </View>
        )}
      </Card>

      {/* Red Log Out CTA */}
      <TouchableOpacity
        onPress={onLogout}
        style={[
          styles.logoutButton,
          {
            backgroundColor: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)',
            borderColor: isLight ? '#fca5a5' : '#7f1d1d',
          },
        ]}
      >
        <Text style={styles.logoutButtonText}>🚪 Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  profileOverviewCard: {
    borderRadius: 16,
    marginBottom: 16,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: '#00D488',
    backgroundColor: 'rgba(0, 212, 136, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChar: {
    fontSize: 20,
    fontWeight: '900',
    color: '#047857',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
  },
  profilePhone: {
    fontSize: 12,
    marginTop: 1,
  },
  completeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  completeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  setupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  setupTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  setupSub: {
    fontSize: 10,
    marginTop: 1,
  },
  kycSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    gap: 8,
  },
  kycTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  kycRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kycLabel: {
    fontSize: 11,
  },
  kycVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  utilitiesCard: {
    borderRadius: 16,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    gap: 12,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  chevron: {
    fontSize: 18,
    fontWeight: '700',
  },
  expandableBox: {
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
    marginHorizontal: 8,
  },
  supportPhone: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  supportEmail: {
    fontSize: 11,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  versionSub: {
    fontSize: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 30,
  },
  logoutButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
