/**
 * Operator Profile Screen
 * Authoritative endpoint: GET / PUT /api/v1/operator/profile
 *
 * Requirements:
 * - Profile display (User account + Operator company metadata)
 * - Editable company metadata supported by backend (companyName, contactPhone, contactEmail)
 * - Read-only tenantId, businessCode, and authorization role
 * - Secure logout (clears operator store and native auth tokens)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Card, Badge, Button, TextInput, LoadingIndicator, ErrorState } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useAuthStore } from '../../stores/auth.store';
import { useOperatorStore } from '../../stores/operator.store';
import { useNavigationStore } from '../../navigation/navigation.store';

export const OperatorProfileScreen: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const authStore = useAuthStore();
  const { openLogoutModal } = useNavigationStore();
  const {
    profile,
    isLoadingProfile,
    profileError,
    fetchProfile,
    updateProfile,
    resetAllState,
  } = useOperatorStore();

  const user = authStore.user;

  const [companyName, setCompanyName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.companyName || '');
      setContactPhone(profile.contactPhone || '');
      setContactEmail(profile.contactEmail || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setValidationError(null);
    setSaveSuccess(false);

    if (companyName.trim().length < 2) {
      setValidationError('Company name must be at least 2 characters');
      return;
    }

    if (contactPhone.trim() && !/^[6-9]\d{9}$/.test(contactPhone.trim())) {
      setValidationError('Contact phone must be a valid 10-digit Indian mobile number');
      return;
    }

    const success = await updateProfile({
      companyName: companyName.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      contactEmail: contactEmail.trim().toLowerCase() || undefined,
    });

    if (success) {
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleLogout = () => {
    openLogoutModal();
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, isMobile && styles.mobileContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Hero Card */}
      <Card
        padding={20}
        style={[
          styles.profileHeroCard,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
            borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)',
          },
        ]}
      >
        <View style={styles.heroRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarIcon}>🏢</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <Badge label="OPERATOR ADMIN" variant="mint" size="sm" />
              <Badge
                label={profile?.status || 'ACTIVE'}
                variant={profile?.status === 'ACTIVE' ? 'mint' : 'neutral'}
                size="sm"
              />
            </View>

            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {user?.fullName || 'Transport Fleet Owner'}
            </Text>
            <Text style={[styles.userContact, { color: colors.textSecondary }]}>
              📞 {user?.phone || 'No phone'} {user?.email ? `• ✉️ ${user.email}` : ''}
            </Text>
          </View>
        </View>

        {/* Read-Only Invariants */}
        <View style={styles.invariantsBox}>
          <View style={styles.invItem}>
            <Text style={styles.invLabel}>TENANT UUID (READ-ONLY)</Text>
            <Text style={[styles.invValue, { color: colors.textPrimary }]}>
              {profile?.id || user?.tenantId || 'Tenant Context Bound'}
            </Text>
          </View>
          <View style={styles.invItem}>
            <Text style={styles.invLabel}>BUSINESS CODE</Text>
            <Text style={[styles.invValue, { color: colors.textPrimary }]}>
              {profile?.businessCode || 'N/A'}
            </Text>
          </View>
        </View>
      </Card>

      {/* 2. Loading / Error States */}
      {isLoadingProfile && !profile && (
        <Card padding={24} style={styles.stateCard}>
          <LoadingIndicator message="Loading operator company profile..." />
        </Card>
      )}

      {profileError && (
        <Card padding={16} style={[styles.stateCard, { borderColor: '#ef4444' }]}>
          <ErrorState
            title="Failed to Load Company Profile"
            message={profileError}
            retryLabel="Retry"
            onRetry={fetchProfile}
          />
        </Card>
      )}

      {/* 3. Company Metadata Form */}
      {profile && (
        <Card
          padding={20}
          style={[
            styles.metadataCard,
            {
              backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
              borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Company Profile & Dispatch Details
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Authoritative organization settings supported by backend
              </Text>
            </View>

            {!isEditing ? (
              <Button
                title="✏️ Edit Details"
                variant="outline"
                size="sm"
                onPress={() => setIsEditing(true)}
              />
            ) : (
              <Button
                title="Cancel"
                variant="outline"
                size="sm"
                onPress={() => {
                  setIsEditing(false);
                  setCompanyName(profile.companyName || '');
                  setContactPhone(profile.contactPhone || '');
                  setContactEmail(profile.contactEmail || '');
                  setValidationError(null);
                }}
              />
            )}
          </View>

          {validationError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {validationError}</Text>
            </View>
          )}

          {saveSuccess && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>✓ Company details updated successfully.</Text>
            </View>
          )}

          <TextInput
            label="COMPANY / FLEET NAME *"
            placeholder="e.g. Mayurbhanj Rural Express"
            value={companyName}
            onChangeText={setCompanyName}
            disabled={!isEditing}
            style={styles.field}
          />

          <TextInput
            label="OPERATIONS CONTACT PHONE *"
            placeholder="e.g. 9876543210"
            value={contactPhone}
            onChangeText={setContactPhone}
            disabled={!isEditing}
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.field}
          />

          <TextInput
            label="OPERATIONS CONTACT EMAIL"
            placeholder="e.g. operations@ruralbus.in"
            value={contactEmail}
            onChangeText={setContactEmail}
            disabled={!isEditing}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.field}
          />

          {isEditing && (
            <View style={styles.saveActions}>
              <Button
                title={isLoadingProfile ? 'Saving...' : 'Save Profile Changes'}
                variant="primary"
                size="md"
                isLoading={isLoadingProfile}
                onPress={handleSave}
              />
            </View>
          )}
        </Card>
      )}

      {/* 4. Security & Secure Logout */}
      <Card
        padding={16}
        style={[
          styles.logoutCard,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
            borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)',
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 4 }]}>
          Session & Account Security
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginBottom: 14 }]}>
          Logging out completely invalidates in-memory session tokens and clears all tenant state.
        </Text>

        <Button
          title="🔒 Secure Sign Out"
          variant="danger"
          size="md"
          onPress={handleLogout}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 16,
  },
  mobileContainer: {
    padding: 12,
    gap: 12,
  },
  profileHeroCard: {
    borderRadius: 14,
    borderWidth: 1,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 212, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 28,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  userContact: {
    fontSize: 12,
    marginTop: 2,
  },
  invariantsBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
    gap: 8,
  },
  invItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  invLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  invValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  stateCard: {
    borderRadius: 12,
  },
  metadataCard: {
    borderRadius: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
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
  saveActions: {
    marginTop: 6,
  },
  logoutCard: {
    borderRadius: 14,
    borderWidth: 1,
  },
});
