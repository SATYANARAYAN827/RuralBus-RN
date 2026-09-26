import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Card, Button } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useAuthStore } from '../../stores/auth.store';
import { useDriverStore } from '../../stores/driver.store';

interface DriverProfileScreenProps {
  onLogout: () => void;
  onOpenSos: () => void;
}

export const DriverProfileScreen: React.FC<DriverProfileScreenProps> = ({
  onLogout,
  onOpenSos,
}) => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const { user } = useAuthStore();
  const { activeTrip } = useDriverStore();

  const getInitials = (name?: string) => {
    if (!name) return 'DD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, isMobile && styles.mobileContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Highway Emergency Assistance Banner */}
      <Card
        padding={14}
        style={[
          styles.sosBanner,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.sosLeft}>
          <View style={styles.onlineDot} />
          <View>
            <Text style={[styles.sosTitle, { color: colors.textPrimary }]}>
              Emergency Assistance & Highway SOS
            </Text>
            <Text style={[styles.sosSubtitle, { color: colors.textSecondary }]}>
              Press in case of breakdown, medical crisis or accident
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.sosButton,
            {
              backgroundColor: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.2)',
              borderColor: 'rgba(239, 68, 68, 0.4)',
            },
          ]}
          onPress={onOpenSos}
          activeOpacity={0.8}
        >
          <Text style={[styles.sosButtonText, { color: '#ef4444' }]}>
            🚨 EMERGENCY SOS
          </Text>
        </TouchableOpacity>
      </Card>

      {/* 2. Header */}
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
          Driver Profile & Credentials
        </Text>
        <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
          Commercial heavy passenger vehicle duty credentials
        </Text>
      </View>

      {/* 3. Driver Profile Details Card (Matches Golden Screenshot) */}
      <Card
        padding={24}
        style={[
          styles.profileCard,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
            borderColor: colors.border,
          },
        ]}
      >
        {/* Driver Identity Header */}
        <View style={styles.identityRow}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: isLight ? '#dcfce7' : 'rgba(0, 212, 136, 0.2)' },
            ]}
          >
            <Text style={styles.avatarText}>
              {getInitials(user?.fullName || 'Demo Driver')}
            </Text>
          </View>

          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.driverName, { color: colors.textPrimary }]}>
              {user?.fullName || 'Demo Driver'}
            </Text>
            <Text style={styles.accreditationBadge}>
              AUTHORISED COMMERCIAL DRIVER
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* 4 Detail Boxes */}
        <View style={styles.boxesList}>
          {/* Box 1: Assigned Vehicle */}
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.boxLabel, { color: colors.textMuted }]}>
              ASSIGNED VEHICLE
            </Text>
            <Text style={[styles.boxValue, { color: colors.textPrimary }]}>
              {activeTrip
                ? `${activeTrip.busRegistrationNumber} (${activeTrip.busModel})`
                : 'No vehicle currently assigned'}
            </Text>
          </View>

          {/* Box 2: Assigned Route */}
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.boxLabel, { color: colors.textMuted }]}>
              ASSIGNED ROUTE
            </Text>
            <Text style={[styles.boxValue, { color: colors.textPrimary }]}>
              {activeTrip
                ? `${activeTrip.routeCode} (${activeTrip.origin} ➔ ${activeTrip.destination})`
                : 'No route currently assigned'}
            </Text>
          </View>

          {/* Box 3: Registered Mobile */}
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.boxLabel, { color: colors.textMuted }]}>
              REGISTERED MOBILE
            </Text>
            <Text style={[styles.boxValue, { color: colors.textPrimary }]}>
              {user?.phone || 'Not Registered'}
            </Text>
          </View>

          {/* Box 4: Commercial License */}
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.boxLabel, { color: colors.textMuted }]}>
              COMMERCIAL LICENSE
            </Text>
            <Text style={[styles.boxValue, { color: '#00D488' }]}>
              Commercial Heavy Passenger Vehicle
            </Text>
          </View>
        </View>

        {/* 4. Logout of Duty Button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            },
          ]}
          onPress={onLogout}
          activeOpacity={0.8}
        >
          <Text style={[styles.logoutText, { color: '#ef4444' }]}>
            🚪 Log Out of Duty
          </Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  mobileContainer: {
    paddingHorizontal: 4,
  },
  sosBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    flexWrap: 'wrap',
    gap: 12,
  },
  sosLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 260,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  sosTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sosSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sosButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  sosButtonText: {
    fontSize: 12,
    fontWeight: '900',
  },
  header: {
    gap: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 18,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#00D488',
  },
  driverName: {
    fontSize: 20,
    fontWeight: '900',
  },
  accreditationBadge: {
    fontSize: 11,
    fontWeight: '900',
    color: '#00D488',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  boxesList: {
    gap: 12,
  },
  infoBox: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  boxLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  boxValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  logoutButton: {
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
