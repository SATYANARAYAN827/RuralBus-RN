import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Card, Badge, Button } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useAuthStore } from '../../stores/auth.store';
import { useConductorStore } from '../../stores/conductor.store';
import { useNavigationStore } from '../../navigation/navigation.store';

export const ConductorProfileScreen: React.FC = () => {
  const { colors, brandColors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const authStore = useAuthStore();
  const { openLogoutModal } = useNavigationStore();
  const {
    activeTrip,
    stats,
    settlement,
    fetchStats,
    fetchSettlement,
    resetConductorState,
  } = useConductorStore();

  const user = authStore.user;

  useEffect(() => {
    fetchStats();
    if (activeTrip?.id) {
      fetchSettlement(activeTrip.id);
    }
  }, [fetchStats, fetchSettlement, activeTrip?.id]);

  const handleLogout = () => {
    openLogoutModal();
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, isMobile && styles.mobileContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Conductor Identity Profile Card */}
      <Card
        padding={20}
        style={[
          styles.profileCard,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.profileHeader}>
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: brandColors.primary },
            ]}
          >
            <Text style={styles.avatarText}>
              {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'CO'}
            </Text>
          </View>

          <View style={styles.profileMeta}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>
                {user?.fullName || 'Duty Conductor'}
              </Text>
              <Badge variant="mint" label="CONDUCTOR" />
            </View>

            <Text style={[styles.phone, { color: colors.textSecondary }]}>
              📞 {user?.phone || 'Phone not linked'}
            </Text>

            <Text style={[styles.tenantText, { color: colors.textMuted }]}>
              Tenant ID: {user?.tenantId || 'Transport Depot'}
            </Text>
          </View>
        </View>
      </Card>

      {/* 2. Assigned Vehicle & Operational Roster */}
      <Card
        padding={18}
        style={[
          styles.rosterCard,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          Assigned Transport Fleet Assignment
        </Text>

        <View style={styles.rosterRow}>
          <View style={styles.rosterCol}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              BUS REGISTRATION
            </Text>
            <Text style={[styles.value, { color: brandColors.primary }]}>
              {activeTrip?.busRegistrationNumber || 'Depot Reserve Bus'}
            </Text>
          </View>

          <View style={styles.rosterCol}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              BUS MODEL
            </Text>
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {activeTrip?.busModel || 'Commercial Transit'}
            </Text>
          </View>
        </View>

        <View style={styles.rosterRow}>
          <View style={styles.rosterCol}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              ACTIVE CORRIDOR
            </Text>
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {activeTrip ? `${activeTrip.origin} ➔ ${activeTrip.destination}` : 'State Rural Highway'}
            </Text>
          </View>

          <View style={styles.rosterCol}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              SEATING CAPACITY
            </Text>
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {activeTrip?.totalSeats || 40} Seats
            </Text>
          </View>
        </View>
      </Card>

      {/* 3. Cash Reconciliation & Settlement Summary */}
      <Card
        padding={18}
        style={[
          styles.settlementCard,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          Trip Cash Settlement & Revenue Reconciliation
        </Text>

        <View style={styles.settlementGrid}>
          <View style={styles.settlementBox}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              CASH TICKETS ISSUED
            </Text>
            <Text style={[styles.settlementNum, { color: colors.textPrimary }]}>
              {settlement?.cashTicketCount ?? 0}
            </Text>
            <Text style={[styles.settlementSub, { color: brandColors.primary }]}>
              ₹{settlement?.cashRevenueAmount ?? 0}
            </Text>
          </View>

          <View style={styles.settlementBox}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              DIGITAL QR TICKETS
            </Text>
            <Text style={[styles.settlementNum, { color: colors.textPrimary }]}>
              {settlement?.digitalTicketCount ?? (stats?.totalPassengersBoarded || 0)}
            </Text>
            <Text style={[styles.settlementSub, { color: '#10b981' }]}>
              ₹{settlement?.digitalRevenueAmount ?? 0}
            </Text>
          </View>
        </View>

        <View style={styles.totalRevenueBanner}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            TOTAL SHIFT COLLECTIONS (ALL TICKETS)
          </Text>
          <Text style={[styles.grandTotal, { color: brandColors.primary }]}>
            ₹{settlement?.totalRevenue ?? (stats?.totalShiftCollections || 0)}
          </Text>
        </View>
      </Card>

      {/* 4. Security & Logout Action */}
      <Button
        title="End Shift & Secure Logout"
        variant="danger"
        size="lg"
        icon="🚪"
        onPress={handleLogout}
        style={{ marginTop: 8 }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  mobileContainer: {
    paddingHorizontal: 4,
  },
  profileCard: {
    borderRadius: 14,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
  },
  profileMeta: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '900',
  },
  phone: {
    fontSize: 13,
    fontWeight: '600',
  },
  tenantText: {
    fontSize: 11,
  },
  rosterCard: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  rosterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rosterCol: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
  },
  settlementCard: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
  },
  settlementGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  settlementBox: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(150, 150, 150, 0.06)',
    alignItems: 'center',
    gap: 4,
  },
  settlementNum: {
    fontSize: 22,
    fontWeight: '900',
  },
  settlementSub: {
    fontSize: 13,
    fontWeight: '800',
  },
  totalRevenueBanner: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 212, 136, 0.08)',
    alignItems: 'center',
    gap: 4,
  },
  grandTotal: {
    fontSize: 26,
    fontWeight: '900',
  },
});
