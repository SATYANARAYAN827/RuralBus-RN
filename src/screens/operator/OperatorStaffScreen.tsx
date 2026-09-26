/**
 * Operator Staff Roster Screen
 * Authoritative management of Drivers & Conductors under the current tenant:
 * - List staff with real operational role and active status
 * - Provision new staff with HTTPS password hashing
 * - Edit full name and bus assignment
 * - Toggle active / suspended status
 * - Trigger secure password reset
 * - Remove / unlink staff member
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Card, Badge, Button, TextInput, LoadingIndicator, EmptyState, ErrorState } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useOperatorStore } from '../../stores/operator.store';
import { StaffMember } from '../../types/operator.types';

export const OperatorStaffScreen: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    staff,
    totalStaff,
    activeDriversCount,
    activeConductorsCount,
    staffRoleFilter,
    setStaffRoleFilter,
    staffSearchQuery,
    setStaffSearchQuery,
    isLoadingStaff,
    staffError,
    fetchStaff,
    updateStaffStatus,
    setIsAddStaffModalOpen,
    setIsEditStaffModalOpen,
    setEditingStaff,
    setIsResetPasswordModalOpen,
    setResetPasswordStaff,
  } = useOperatorStore();

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const filteredStaff = staff.filter((s) => {
    if (staffRoleFilter !== 'ALL' && s.role !== staffRoleFilter) return false;
    if (staffSearchQuery.trim()) {
      const q = staffSearchQuery.toLowerCase();
      const matchName = s.fullName.toLowerCase().includes(q);
      const matchPhone = s.phone.includes(q);
      return matchName || matchPhone;
    }
    return true;
  });

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, isMobile && styles.mobileContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header & Provision Action */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            Staff Roster ({totalStaff})
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
            {activeDriversCount} Drivers • {activeConductorsCount} Conductors
          </Text>
        </View>
        <Button
          title="+ Provision Staff"
          variant="mint"
          size="sm"
          onPress={() => setIsAddStaffModalOpen(true)}
        />
      </View>

      {/* 2. Search & Role Filter Pills */}
      <Card padding={12} style={styles.filterCard}>
        <TextInput
          placeholder="Search staff by name or mobile number..."
          value={staffSearchQuery}
          onChangeText={setStaffSearchQuery}
          style={styles.searchInput}
        />

        <View style={styles.rolePillsRow}>
          {(['ALL', 'DRIVER', 'CONDUCTOR'] as const).map((role) => {
            const isSelected = staffRoleFilter === role;
            return (
              <TouchableOpacity
                key={role}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected
                      ? '#00D488'
                      : isLight
                      ? '#f1f5f9'
                      : 'rgba(255,255,255,0.06)',
                  },
                ]}
                onPress={() => setStaffRoleFilter(role)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? '#000000' : colors.textPrimary },
                  ]}
                >
                  {role === 'ALL' ? 'ALL STAFF' : `${role}S`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* 3. Loading / Error / Empty States */}
      {isLoadingStaff && (
        <Card padding={24} style={styles.stateCard}>
          <LoadingIndicator message="Loading crew roster..." />
        </Card>
      )}

      {staffError && (
        <Card padding={16} style={[styles.stateCard, { borderColor: '#ef4444' }]}>
          <ErrorState
            title="Failed to Load Staff"
            message={staffError}
            retryLabel="Retry"
            onRetry={fetchStaff}
          />
        </Card>
      )}

      {!isLoadingStaff && filteredStaff.length === 0 && (
        <Card padding={32} style={styles.stateCard}>
          <EmptyState
            title="No Staff Members Found"
            description={
              staffSearchQuery || staffRoleFilter !== 'ALL'
                ? 'No staff members match your search or role filter.'
                : 'No drivers or conductors have been provisioned under this operator tenant yet.'
            }
            icon="👥"
            action={{
              label: '+ Provision First Staff',
              onPress: () => setIsAddStaffModalOpen(true),
            }}
          />
        </Card>
      )}

      {/* 4. Staff Cards List */}
      <View style={styles.staffListGrid}>
        {filteredStaff.map((member) => (
          <Card
            key={member.id}
            padding={16}
            style={[
              styles.staffCard,
              {
                backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)',
              },
            ]}
          >
            <View style={styles.staffCardHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <Badge
                    label={member.role}
                    variant={member.role === 'DRIVER' ? 'mint' : 'info'}
                    size="sm"
                  />
                  <Badge
                    label={member.isActive ? 'ACTIVE' : 'SUSPENDED'}
                    variant={member.isActive ? 'mint' : 'neutral'}
                    size="sm"
                  />
                </View>
                <Text style={[styles.staffName, { color: colors.textPrimary }]}>
                  {member.role === 'DRIVER' ? '👨‍✈️ ' : '🎫 '}
                  {member.fullName}
                </Text>
                <Text style={[styles.staffPhone, { color: colors.textSecondary }]}>
                  📞 {member.phone} {member.email ? `• ✉️ ${member.email}` : ''}
                </Text>
              </View>

              <View style={styles.cardActions}>
                <Button
                  title={member.isActive ? 'Suspend' : 'Activate'}
                  variant="outline"
                  size="sm"
                  onPress={() => updateStaffStatus(member.id, !member.isActive)}
                />
              </View>
            </View>

            {/* Bus Assignment Row */}
            <View style={styles.assignmentRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.assignLabel}>ASSIGNED VEHICLE</Text>
                <Text style={[styles.assignValue, { color: colors.textPrimary }]}>
                  {member.busRegistrationNumber
                    ? `🚌 ${member.busRegistrationNumber}`
                    : 'Unassigned (Standby Pool)'}
                </Text>
              </View>

              <View style={styles.actionButtonsRow}>
                <Button
                  title="🔑 Reset Password"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setResetPasswordStaff(member);
                    setIsResetPasswordModalOpen(true);
                  }}
                />
                <Button
                  title="Edit / Assign"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setEditingStaff(member);
                    setIsEditStaffModalOpen(true);
                  }}
                />
              </View>
            </View>
          </Card>
        ))}
      </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  filterCard: {
    borderRadius: 12,
  },
  searchInput: {
    marginBottom: 8,
  },
  rolePillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stateCard: {
    borderRadius: 12,
  },
  staffListGrid: {
    gap: 12,
  },
  staffCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
  staffCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  staffName: {
    fontSize: 17,
    fontWeight: '800',
  },
  staffPhone: {
    fontSize: 12,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
    gap: 10,
  },
  assignLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  assignValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
