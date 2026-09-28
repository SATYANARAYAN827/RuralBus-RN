import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Card, Badge, Button, LoadingIndicator, ErrorState, TextInput } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useSuperAdminStore } from '../../stores/superadmin.store';
import { EditOperatorModal } from './modals/EditOperatorModal';
import { DeleteOperatorConfirmModal } from './modals/DeleteOperatorConfirmModal';
import { OperatorDetailsModal } from './modals/OperatorDetailsModal';
import type { PlatformOperator } from '../../types/superadmin.types';

export const SuperAdminOperatorsScreen: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    operators,
    operatorSearchQuery,
    operatorStatusFilter,
    isLoadingOperators,
    operatorError,
    setOperatorSearchQuery,
    setOperatorStatusFilter,
    fetchOperators,
    createOperator,
    updateOperator,
    setEditingOperator,
    setIsEditOperatorModalOpen,
    setIsDeleteOperatorConfirmId,
    isDeleteOperatorConfirmId,
    isEditOperatorModalOpen,
    editingOperator,
  } = useSuperAdminStore();

  const [isAddOwnerInlineOpen, setIsAddOwnerInlineOpen] = useState(false);
  const [selectedOwnerDetail, setSelectedOwnerDetail] = useState<PlatformOperator | null>(null);

  // Form fields matching Screenshot 2
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [corridor, setCorridor] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  const resetForm = () => {
    setCompanyName('');
    setOwnerName('');
    setPhone('');
    setPassword('');
    setCorridor('');
    setFormError(null);
  };

  const handleCreateOwner = async () => {
    if (!companyName.trim()) {
      setFormError('Company Name is required.');
      return;
    }
    if (!ownerName.trim()) {
      setFormError('Owner Full Name is required.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setFormError('Valid 10-digit mobile number is required.');
      return;
    }
    if (!password || password.length < 8) {
      setFormError('Initial password must be at least 8 characters.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const ok = await createOperator({
        companyName: companyName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        password,
      });

      if (!ok) {
        const storeErr = useSuperAdminStore.getState().operatorError;
        setFormError(storeErr || 'Failed to create operator account.');
        return;
      }

      setSuccessBanner(`Operator account "${companyName.trim()}" created successfully! Owner can now log in.`);
      resetForm();
      setIsAddOwnerInlineOpen(false);
      setOperatorSearchQuery('');
      await fetchOperators();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create operator account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = operators.filter((op) => {
    const q = operatorSearchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      op.companyName.toLowerCase().includes(q) ||
      op.businessCode.toLowerCase().includes(q) ||
      (op.contactPhone || '').includes(operatorSearchQuery.trim()) ||
      (op.ownerPhone || '').includes(operatorSearchQuery.trim()) ||
      (op.ownerName || '').toLowerCase().includes(q);
    const matchStatus =
      operatorStatusFilter === 'ALL' || op.status === operatorStatusFilter;
    return matchSearch && matchStatus;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '9/24/2026';
    try {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    } catch {
      return '9/24/2026';
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header Row matching Screenshot 2 */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: isLight ? '#0f172a' : '#ffffff' }]}>
            Registered Fleet Owners ({operators.length})
          </Text>
          <Text style={[styles.subtitle, { color: isLight ? '#475569' : '#94a3b8' }]}>
            Manage transport company accounts, allocate fleet vehicles, and authorize staff
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addOwnerTopBtn}
          onPress={() => {
            setSuccessBanner(null);
            setIsAddOwnerInlineOpen(!isAddOwnerInlineOpen);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.addOwnerTopBtnText}>+ Add New Owner</Text>
        </TouchableOpacity>
      </View>

      {/* Success Notification Banner */}
      {successBanner && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>✅ {successBanner}</Text>
          <TouchableOpacity onPress={() => setSuccessBanner(null)}>
            <Text style={{ color: '#00D488', fontWeight: '800' }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Inline Creation Card matching Screenshot 2 */}
      {isAddOwnerInlineOpen && (
        <View
          style={[
            styles.inlineCard,
            {
              backgroundColor: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.95)',
              borderColor: '#a855f7',
            },
          ]}
        >
          <View style={styles.inlineCardHeader}>
            <Text style={styles.inlineCardTitle}>
              Register New Transport Company & Owner Account
            </Text>
            <TouchableOpacity onPress={() => setIsAddOwnerInlineOpen(false)}>
              <Text style={styles.inlineCardClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {formError && (
            <View style={styles.formErrorBox}>
              <Text style={styles.formErrorText}>⚠️ {formError}</Text>
            </View>
          )}

          <View style={styles.formGrid}>
            {/* Row 1: Company Name & Owner Full Name */}
            <View style={[styles.formRow, isMobile && styles.formRowMobile]}>
              <View style={styles.formCol}>
                <Text style={[styles.inputLabel, { color: isLight ? '#475569' : '#cbd5e1' }]}>
                  COMPANY / TENANT NAME *
                </Text>
                <TextInput
                  placeholder="e.g. Utkal Royal Transport"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </View>

              <View style={styles.formCol}>
                <Text style={[styles.inputLabel, { color: isLight ? '#475569' : '#cbd5e1' }]}>
                  OWNER FULL NAME *
                </Text>
                <TextInput
                  placeholder="e.g. Ramesh Chandra Das"
                  value={ownerName}
                  onChangeText={setOwnerName}
                />
              </View>
            </View>

            {/* Row 2: Mobile Number & Initial Password */}
            <View style={[styles.formRow, isMobile && styles.formRowMobile]}>
              <View style={styles.formCol}>
                <Text style={[styles.inputLabel, { color: isLight ? '#475569' : '#cbd5e1' }]}>
                  MOBILE NUMBER (FOR LOGIN) *
                </Text>
                <TextInput
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formCol}>
                <Text style={[styles.inputLabel, { color: isLight ? '#475569' : '#cbd5e1' }]}>
                  INITIAL PASSWORD (FOR OWNER LOGIN) *
                </Text>
                <TextInput
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  leftIcon="🔒"
                />
              </View>
            </View>

            {/* Row 3: Operating Corridor */}
            <View style={{ width: '100%' }}>
              <Text style={[styles.inputLabel, { color: isLight ? '#475569' : '#cbd5e1' }]}>
                PRIMARY OPERATING CORRIDOR
              </Text>
              <TextInput
                placeholder="e.g. Origin ↔ Destination"
                value={corridor}
                onChangeText={setCorridor}
              />
            </View>

            {/* Buttons Row */}
            <View style={styles.inlineFormButtons}>
              <TouchableOpacity
                style={styles.submitOwnerBtn}
                onPress={handleCreateOwner}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Text style={styles.submitOwnerBtnText}>
                  {isSubmitting ? 'Creating Company...' : 'Create Company Account & Authorize Owner'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelOwnerBtn}
                onPress={() => {
                  resetForm();
                  setIsAddOwnerInlineOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelOwnerBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Filter / Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search company, owner name, phone..."
          value={operatorSearchQuery}
          onChangeText={setOperatorSearchQuery}
          leftIcon="🔍"
          rightIcon={operatorSearchQuery ? '✕' : undefined}
          onRightIconPress={() => setOperatorSearchQuery('')}
        />
      </View>

      {/* Fleet Owner Cards List */}
      <View style={{ gap: 16 }}>
        {filtered.map((op) => {
          const isOperatorActive = op.status === 'ACTIVE';

          return (
            <View
              key={op.id}
              style={[
                styles.ownerCardContainer,
                {
                  backgroundColor: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.75)',
                  borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.10)',
                },
              ]}
            >
              {/* Header row */}
              <View style={styles.opHeaderRow}>
                <View style={styles.opTitleGroup}>
                  <Text style={styles.buildingIcon}>🏢</Text>
                  <Text style={[styles.opCompanyName, { color: colors.textPrimary }]}>
                    {op.companyName}
                  </Text>
                  <View
                    style={[
                      styles.activePill,
                      !isOperatorActive && styles.suspendedPill,
                    ]}
                  >
                    <Text
                      style={[
                        styles.activePillText,
                        !isOperatorActive && styles.suspendedPillText,
                      ]}
                    >
                      {op.status}
                    </Text>
                  </View>
                  <View style={styles.busCountPill}>
                    <Text style={styles.busCountPillText}>
                      {op.busesCount || 0} Buses
                    </Text>
                  </View>
                  <View style={styles.staffCountPill}>
                    <Text style={styles.staffCountPillText}>
                      {op.staffCount || 0} Staff
                    </Text>
                  </View>
                </View>

                {/* Right Action Buttons */}
                <View style={styles.opActionsGroup}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => {
                      setEditingOperator(op);
                      setIsEditOperatorModalOpen(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.editBtnText, { color: colors.textPrimary }]}>
                      Edit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => setSelectedOwnerDetail(op)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewDetailsBtnText}>View All Details ➔</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.deactivateOpBtn, !isOperatorActive && styles.activateOpBtn]}
                    onPress={() =>
                      updateOperator(op.id, {
                        status: isOperatorActive ? 'SUSPENDED' : 'ACTIVE',
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.deactivateOpText,
                        !isOperatorActive && { color: '#059669' },
                      ]}
                    >
                      {isOperatorActive ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteOpBtn}
                    onPress={() => setIsDeleteOperatorConfirmId(op.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteOpText}>Delete Operator</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Subheader info line */}
              <Text style={[styles.opSubInfo, { color: colors.textSecondary }]}>
                Owner:{' '}
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                  {op.ownerName || 'Operator Admin'}
                </Text>
                {' · '}Mobile:{' '}
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                  {op.ownerPhone || op.contactPhone || '—'}
                </Text>
                {' · '}Corridor:{' '}
                <Text style={{ color: '#00D488', fontWeight: '700' }}>
                  {op.corridor || 'State Rural Corridor'}
                </Text>
                {' · '}Code:{' '}
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                  {op.businessCode}
                </Text>
              </Text>

              {/* Added Badge Chip */}
              <View style={styles.addedBadgeChip}>
                <Text style={styles.addedBadgeIcon}>🛡️</Text>
                <Text style={styles.addedBadgeText}>
                  Added by Super Admin · {formatDate(op.createdAt)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Edit Operator Modal */}
      {isEditOperatorModalOpen && editingOperator ? (
        <EditOperatorModal
          isOpen={isEditOperatorModalOpen}
          onClose={() => setIsEditOperatorModalOpen(false)}
          operator={editingOperator}
        />
      ) : null}

      {/* Delete Operator Confirm Modal */}
      <DeleteOperatorConfirmModal
        isOpen={Boolean(isDeleteOperatorConfirmId)}
        onClose={() => setIsDeleteOperatorConfirmId(null)}
        tenantId={isDeleteOperatorConfirmId || ''}
        operatorName={operators.find((o) => o.id === isDeleteOperatorConfirmId)?.companyName || 'Operator'}
      />

      {/* Operator Details Modal (Buses & Drivers/Conductors) */}
      <OperatorDetailsModal
        isOpen={Boolean(selectedOwnerDetail)}
        onClose={() => setSelectedOwnerDetail(null)}
        operator={selectedOwnerDetail}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 24, maxWidth: 1200, alignSelf: 'center', width: '100%', paddingBottom: 40 },
  containerMobile: { padding: 14 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  addOwnerTopBtn: {
    backgroundColor: '#a855f7',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    boxShadow: '0 4px 16px rgba(168, 85, 247, 0.35)',
  },
  addOwnerTopBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  successBanner: {
    backgroundColor: 'rgba(0, 212, 136, 0.12)',
    borderWidth: 1.5,
    borderColor: '#00D488',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successBannerText: {
    color: '#00D488',
    fontSize: 13,
    fontWeight: '700',
  },
  inlineCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 22,
    marginBottom: 20,
    // @ts-ignore
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
  },
  inlineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inlineCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#c084fc',
  },
  inlineCardClose: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: '700',
  },
  formErrorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  formErrorText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '700',
  },
  formGrid: {
    gap: 14,
  },
  formRow: {
    flexDirection: 'row',
    gap: 14,
  },
  formRowMobile: {
    flexDirection: 'column',
  },
  formCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inlineFormButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  submitOwnerBtn: {
    flex: 1,
    backgroundColor: '#a855f7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitOwnerBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelOwnerBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOwnerBtnText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '800',
  },
  searchBar: {
    marginBottom: 18,
  },
  ownerCardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 8,
  },
  opHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  opTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  buildingIcon: { fontSize: 20 },
  opCompanyName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  activePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activePillText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
  },
  suspendedPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  suspendedPillText: {
    color: '#ef4444',
  },
  busCountPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  busCountPillText: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '800',
  },
  staffCountPill: {
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  staffCountPillText: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '800',
  },
  opActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  opSubInfo: {
    fontSize: 12,
    marginBottom: 10,
  },
  addedBadgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(59, 130, 246, 0.10)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  addedBadgeIcon: {
    fontSize: 11,
  },
  addedBadgeText: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '700',
  },
  deactivateOpBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activateOpBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  deactivateOpText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '800',
  },
  deleteOpBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteOpText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '800',
  },
  editBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  viewDetailsBtn: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: '#a855f7',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  viewDetailsBtnText: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '800',
  },
});
