import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import {
  Card, Badge, Button, LoadingIndicator, ErrorState, EmptyState, TextInput,
} from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useSuperAdminStore } from '../../stores/superadmin.store';
import { AddPlatformStaffModal } from './modals/AddPlatformStaffModal';
import { DeleteStaffConfirmModal } from './modals/DeleteStaffConfirmModal';

export const SuperAdminStaffScreen: React.FC = () => {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const {
    staff, totalStaff, activeDriversCount, activeConductorsCount,
    staffRoleFilter, staffSearchQuery, isLoadingStaff, staffError,
    setStaffRoleFilter, setStaffSearchQuery,
    fetchStaff, updateStaffStatus, setEditingStaff,
    setIsAddStaffModalOpen, isAddStaffModalOpen,
    isDeleteStaffConfirmId, setIsDeleteStaffConfirmId,
    operators,
  } = useSuperAdminStore();

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const filtered = staff.filter((s) => {
    const matchSearch =
      !staffSearchQuery.trim() ||
      s.fullName.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      s.phone.includes(staffSearchQuery);
    const matchRole = staffRoleFilter === 'ALL' || s.role === staffRoleFilter;
    return matchSearch && matchRole;
  });

  const roleFilters: Array<'ALL' | 'DRIVER' | 'CONDUCTOR'> = ['ALL', 'DRIVER', 'CONDUCTOR'];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Platform Staff</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {totalStaff} total · {activeDriversCount} drivers · {activeConductorsCount} conductors
          </Text>
        </View>
        <Button
          title="+ Add Staff"
          variant="primary"
          size="sm"
          onPress={() => setIsAddStaffModalOpen(true)}
        />
      </View>

      <View style={styles.filterRow}>
        <View style={{ flex: 1 }}>
          <TextInput
            placeholder="Search name or phone..."
            value={staffSearchQuery}
            onChangeText={setStaffSearchQuery}
            leftIcon="??"
          />
        </View>
        <View style={styles.rolePills}>
          {roleFilters.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setStaffRoleFilter(f)}
              style={[
                styles.pill,
                {
                  backgroundColor: staffRoleFilter === f ? '#a855f7' : 'rgba(255,255,255,0.06)',
                  borderColor: staffRoleFilter === f ? '#a855f7' : 'rgba(255,255,255,0.12)',
                },
              ]}
            >
              <Text style={[styles.pillText, { color: staffRoleFilter === f ? '#fff' : colors.textSecondary }]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoadingStaff && <LoadingIndicator message="Loading staff..." />}

      {staffError && !isLoadingStaff ? (
        <ErrorState title="Staff Load Error" message={staffError} onRetry={fetchStaff} retryLabel="Retry" />
      ) : null}

      {!isLoadingStaff && !staffError && filtered.length === 0 ? (
        <EmptyState
          icon="??"
          title="No Staff Found"
          description={staffSearchQuery ? 'Try a different search term.' : 'No platform staff provisioned yet.'}
          action={!staffSearchQuery ? { label: 'Add Staff', onPress: () => setIsAddStaffModalOpen(true) } : undefined}
        />
      ) : null}

      {filtered.map((member) => {
        const opName = operators.find((o) => o.id === member.tenantId)?.companyName;
        return (
          <Card key={member.id} padding={14} style={styles.staffCard}>
            <View style={styles.staffHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.staffName, { color: colors.textPrimary }]}>{member.fullName}</Text>
                <Text style={[styles.staffMeta, { color: colors.textSecondary }]}>
                  {member.phone} · {opName || member.tenantId.slice(0, 8)}
                </Text>
              </View>
              <View style={{ gap: 4, alignItems: 'flex-end' }}>
                <Badge
                  variant={member.role === 'DRIVER' ? 'info' : 'success'}
                  label={member.role}
                />
                <Badge
                  variant={member.isActive ? 'success' : 'danger'}
                  label={member.isActive ? 'ACTIVE' : 'SUSPENDED'}
                />
              </View>
            </View>
            <View style={styles.staffActions}>
              <Button
                title={member.isActive ? 'Suspend' : 'Activate'}
                variant={member.isActive ? 'danger' : 'mint'}
                size="sm"
                onPress={() => updateStaffStatus(member.id, !member.isActive)}
              />
              <Button
                title="Remove"
                variant="danger"
                size="sm"
                onPress={() => setIsDeleteStaffConfirmId(member.id)}
              />
            </View>
          </Card>
        );
      })}

      <AddPlatformStaffModal
        isOpen={isAddStaffModalOpen}
        onClose={() => setIsAddStaffModalOpen(false)}
        operators={operators}
      />

      {isDeleteStaffConfirmId && (
        <DeleteStaffConfirmModal
          isOpen={!!isDeleteStaffConfirmId}
          staffId={isDeleteStaffConfirmId}
          staffName={staff.find((s) => s.id === isDeleteStaffConfirmId)?.fullName || ''}
          onClose={() => setIsDeleteStaffConfirmId(null)}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 40, maxWidth: 1000, alignSelf: 'center', width: '100%' },
  containerMobile: { padding: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' },
  rolePills: { flexDirection: 'row', gap: 6 },
  pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5 },
  pillText: { fontSize: 11, fontWeight: '800' },
  staffCard: { marginBottom: 10 },
  staffHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  staffName: { fontSize: 14, fontWeight: '800' },
  staffMeta: { fontSize: 12, marginTop: 2 },
  staffActions: { flexDirection: 'row', gap: 10 },
});
