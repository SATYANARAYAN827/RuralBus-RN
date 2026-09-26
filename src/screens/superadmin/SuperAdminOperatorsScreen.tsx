import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import {
  Card, Badge, Button, LoadingIndicator, ErrorState, EmptyState, TextInput,
} from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useSuperAdminStore } from '../../stores/superadmin.store';
import { AddOperatorModal } from './modals/AddOperatorModal';
import { EditOperatorModal } from './modals/EditOperatorModal';
import { DeleteOperatorConfirmModal } from './modals/DeleteOperatorConfirmModal';
import type { PlatformOperator } from '../../types/superadmin.types';

export const SuperAdminOperatorsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const {
    operators, operatorSearchQuery, operatorStatusFilter, isLoadingOperators, operatorError,
    setOperatorSearchQuery, setOperatorStatusFilter,
    fetchOperators, setEditingOperator, setIsAddOperatorModalOpen, setIsEditOperatorModalOpen,
    setIsDeleteOperatorConfirmId, isDeleteOperatorConfirmId,
    isAddOperatorModalOpen, isEditOperatorModalOpen, editingOperator,
  } = useSuperAdminStore();

  useEffect(() => { fetchOperators(); }, [fetchOperators]);

  const filtered = operators.filter((op) => {
    const matchSearch =
      !operatorSearchQuery.trim() ||
      op.companyName.toLowerCase().includes(operatorSearchQuery.toLowerCase()) ||
      op.businessCode.toLowerCase().includes(operatorSearchQuery.toLowerCase()) ||
      (op.contactPhone || '').includes(operatorSearchQuery);
    const matchStatus =
      operatorStatusFilter === 'ALL' || op.status === operatorStatusFilter;
    return matchSearch && matchStatus;
  });

  const statusFilters: Array<'ALL' | 'ACTIVE' | 'SUSPENDED'> = ['ALL', 'ACTIVE', 'SUSPENDED'];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Transport Operators</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {operators.length} registered · platform governance
          </Text>
        </View>
        <Button
          title="+ Add Operator"
          variant="primary"
          size="sm"
          onPress={() => setIsAddOperatorModalOpen(true)}
        />
      </View>

      <View style={styles.filterRow}>
        <View style={{ flex: 1 }}>
          <TextInput
            placeholder="Search company, code, phone..."
            value={operatorSearchQuery}
            onChangeText={setOperatorSearchQuery}
            leftIcon="??"
          />
        </View>
        <View style={styles.statusFilters}>
          {statusFilters.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setOperatorStatusFilter(f)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: operatorStatusFilter === f ? '#a855f7' : (colors as any).surfaceElevated || 'rgba(255,255,255,0.06)',
                  borderColor: operatorStatusFilter === f ? '#a855f7' : 'rgba(255,255,255,0.12)',
                },
              ]}
            >
              <Text style={[styles.filterPillText, { color: operatorStatusFilter === f ? '#fff' : colors.textSecondary }]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoadingOperators && (
        <LoadingIndicator message="Loading operators..." />
      )}

      {operatorError ? (
        <ErrorState
          title="Failed to Load Operators"
          message={operatorError}
          onRetry={fetchOperators}
          retryLabel="Retry"
        />
      ) : null}

      {!isLoadingOperators && !operatorError && filtered.length === 0 ? (
        <EmptyState
          icon="??"
          title="No Operators Found"
          description={operatorSearchQuery ? 'Try a different search term.' : 'Create the first transport operator.'}
          action={!operatorSearchQuery ? { label: 'Add Operator', onPress: () => setIsAddOperatorModalOpen(true) } : undefined}
        />
      ) : null}

      {filtered.map((op) => (
        <OperatorRow
          key={op.id}
          op={op}
          onEdit={() => {
            setEditingOperator(op);
            setIsEditOperatorModalOpen(true);
          }}
          onDelete={() => setIsDeleteOperatorConfirmId(op.id)}
        />
      ))}

      <AddOperatorModal
        isOpen={isAddOperatorModalOpen}
        onClose={() => setIsAddOperatorModalOpen(false)}
      />
      {editingOperator && (
        <EditOperatorModal
          isOpen={isEditOperatorModalOpen}
          onClose={() => {
            setIsEditOperatorModalOpen(false);
            setEditingOperator(null);
          }}
          operator={editingOperator}
        />
      )}
      {isDeleteOperatorConfirmId && (
        <DeleteOperatorConfirmModal
          isOpen={!!isDeleteOperatorConfirmId}
          tenantId={isDeleteOperatorConfirmId}
          operatorName={operators.find((o) => o.id === isDeleteOperatorConfirmId)?.companyName || ''}
          onClose={() => setIsDeleteOperatorConfirmId(null)}
        />
      )}
    </ScrollView>
  );
};

const OperatorRow: React.FC<{
  op: PlatformOperator;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ op, onEdit, onDelete }) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card padding={14} style={styles.opCard}>
      <TouchableOpacity onPress={() => setExpanded((e) => !e)} activeOpacity={0.7}>
        <View style={styles.opHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.opName, { color: colors.textPrimary }]}>{op.companyName}</Text>
            <Text style={[styles.opCode, { color: colors.textSecondary }]}>
              {op.businessCode} · {op.contactPhone}
            </Text>
          </View>
          <Badge
            variant={op.status === 'ACTIVE' ? 'success' : op.status === 'SUSPENDED' ? 'danger' : 'warning'}
            label={op.status}
          />
          <Text style={{ color: colors.textMuted, marginLeft: 8 }}>{expanded ? '?' : '?'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.opExpanded}>
          <View style={styles.opMeta}>
            <MetaItem label="Owner" value={op.ownerName || '—'} />
            <MetaItem label="Owner Phone" value={op.ownerPhone || '—'} />
            <MetaItem label="Email" value={op.contactEmail || '—'} />
            <MetaItem label="Corridor" value={op.corridor || '—'} />
            <MetaItem label="Buses" value={String(op.busesCount)} />
            <MetaItem label="Staff" value={String(op.staffCount)} />
            <MetaItem label="Created" value={new Date(op.createdAt).toLocaleDateString('en-IN')} />
          </View>
          <View style={styles.opActions}>
            <Button title="Edit" variant="outline" size="sm" onPress={onEdit} icon="??" />
            <Button title="Delete" variant="danger" size="sm" onPress={onDelete} icon="???" />
          </View>
        </View>
      )}
    </Card>
  );
};

const MetaItem: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 13, color: colors.textPrimary, marginTop: 1 }}>{value}</Text>
    </View>
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
  statusFilters: { flexDirection: 'row', gap: 6 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5 },
  filterPillText: { fontSize: 11, fontWeight: '800' },
  opCard: { marginBottom: 10 },
  opHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  opName: { fontSize: 15, fontWeight: '800' },
  opCode: { fontSize: 12, marginTop: 2 },
  opExpanded: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  opMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  opActions: { flexDirection: 'row', gap: 10 },
});
