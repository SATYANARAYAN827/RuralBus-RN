import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Card, Badge, Button, LoadingIndicator, ErrorState } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useSuperAdminStore } from '../../stores/superadmin.store';
import { useAuthStore } from '../../stores/auth.store';
import { useNavigationStore } from '../../navigation/navigation.store';

export const SuperAdminProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { profile, isLoadingProfile, profileError, fetchProfile } = useSuperAdminStore();
  const authStore = useAuthStore();
  const navStore = useNavigationStore();

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleLogout = () => {
    authStore.logout();
    navStore.logout();
  };

  if (isLoadingProfile && !profile) {
    return <LoadingIndicator message="Loading profile..." />;
  }

  if (profileError && !profile) {
    return (
      <ErrorState
        title="Profile Load Error"
        message={profileError}
        onRetry={fetchProfile}
        retryLabel="Retry"
      />
    );
  }

  const displayProfile = profile || authStore.user;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Super Admin Profile</Text>
        <Badge variant="purple" label="PLATFORM ADMIN" />
      </View>

      <Card padding={20} style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(displayProfile?.fullName || 'SA').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>
              {displayProfile?.fullName || '�'}
            </Text>
            <Text style={[styles.role, { color: '#a855f7' }]}>Platform Administrator</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <ProfileField label="Phone" value={displayProfile?.phone || '�'} />
        <ProfileField label="Email" value={displayProfile?.email || '�'} />
        <ProfileField label="Account Status" value={displayProfile?.isActive ? 'Active' : 'Suspended'} />
        {profile?.lastLoginAt && (
          <ProfileField
            label="Last Login"
            value={new Date(profile.lastLoginAt).toLocaleString('en-IN')}
          />
        )}
        {profile?.createdAt && (
          <ProfileField
            label="Account Created"
            value={new Date(profile.createdAt).toLocaleDateString('en-IN')}
          />
        )}
      </Card>

      <Card variant="outlined" padding={18} style={{ marginTop: 16, borderColor: '#ef4444' }}>
        <Text style={[styles.dangerTitle, { color: '#fca5a5' }]}>Session Management</Text>
        <Text style={[styles.dangerDesc, { color: colors.textSecondary }]}>
          Logging out will end your current platform administration session.
        </Text>
        <Button
          title="Log Out from Super Admin Console"
          variant="danger"
          size="md"
          icon="??"
          onPress={handleLogout}
          style={{ marginTop: 12 }}
        />
      </Card>
    </ScrollView>
  );
};

const ProfileField: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 14, color: colors.textPrimary, fontWeight: '600' }}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 40, maxWidth: 700, alignSelf: 'center', width: '100%' },
  containerMobile: { padding: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  profileCard: { marginBottom: 0 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(168,85,247,0.2)', borderWidth: 2, borderColor: '#a855f7', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#a855f7' },
  name: { fontSize: 20, fontWeight: '900' },
  role: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 },
  dangerTitle: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
  dangerDesc: { fontSize: 13 },
});
