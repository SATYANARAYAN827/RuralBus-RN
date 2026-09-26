import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Card, Badge, LoadingIndicator, ErrorState } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useSuperAdminStore } from '../../stores/superadmin.store';

const KpiCard: React.FC<{
  icon: string;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
  bg: string;
}> = ({ icon, label, value, sub, color, bg }) => {
  const { colors } = useTheme();
  return (
    <Card padding={18} style={[styles.kpiCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <View style={[styles.kpiIconBg, { backgroundColor: bg }]}>
          <Text style={{ fontSize: 20 }}>{icon}</Text>
        </View>
        <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      {sub ? <Text style={[styles.kpiSub, { color: colors.textMuted }]}>{sub}</Text> : null}
    </Card>
  );
};

export const SuperAdminHomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { dashboardSummary, operators, isLoadingOperators, operatorError, fetchOperators } =
    useSuperAdminStore();

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  if (isLoadingOperators && !dashboardSummary) {
    return <LoadingIndicator message="Loading platform overview..." />;
  }

  if (operatorError && !dashboardSummary) {
    return (
      <ErrorState
        title="Platform Data Error"
        message={operatorError}
        onRetry={fetchOperators}
        retryLabel="Retry"
      />
    );
  }

  const summary = dashboardSummary;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Platform Dashboard</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Statewide oversight � {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <Badge variant="purple" label="PLATFORM ADMIN" />
      </View>

      <View style={[styles.kpiGrid, isMobile && styles.kpiGridMobile]}>
        <KpiCard
          icon="??"
          label="Total Operators"
          value={summary?.totalOperators ?? '�'}
          sub={`${summary?.activeOperators ?? 0} active`}
          color="#a855f7"
          bg="rgba(168,85,247,0.12)"
        />
        <KpiCard
          icon="?"
          label="Active Operators"
          value={summary?.activeOperators ?? '�'}
          color="#00D488"
          bg="rgba(0,212,136,0.12)"
        />
        <KpiCard
          icon="?"
          label="Suspended"
          value={summary?.suspendedOperators ?? '�'}
          color="#ef4444"
          bg="rgba(239,68,68,0.12)"
        />
        <KpiCard
          icon="??"
          label="Total Fleet Buses"
          value={summary?.totalBuses ?? '�'}
          sub="across all operators"
          color="#38bdf8"
          bg="rgba(56,189,248,0.12)"
        />
        <KpiCard
          icon="??"
          label="Total Staff"
          value={summary?.totalStaff ?? '�'}
          sub="drivers + conductors"
          color="#f59e0b"
          bg="rgba(245,158,11,0.12)"
        />
      </View>

      {operatorError ? (
        <Card variant="outlined" padding={14} style={{ marginTop: 8, borderColor: '#ef4444' }}>
          <Text style={{ color: '#fca5a5', fontSize: 13 }}>?? {operatorError}</Text>
        </Card>
      ) : null}

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        Recent Operators ({operators.length})
      </Text>

      {operators.length === 0 && !isLoadingOperators ? (
        <Card padding={24} style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>??</Text>
          <Text style={[{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }]}>
            No transport operators registered yet.{'\n'}Create the first operator in the Operators tab.
          </Text>
        </Card>
      ) : (
        operators.slice(0, 5).map((op) => (
          <Card key={op.id} padding={14} style={styles.opRow}>
            <View style={styles.opRowInner}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.opName, { color: colors.textPrimary }]}>{op.companyName}</Text>
                <Text style={[styles.opMeta, { color: colors.textSecondary }]}>
                  {op.businessCode} � {op.busesCount} buses � {op.staffCount} staff
                </Text>
              </View>
              <Badge
                variant={op.status === 'ACTIVE' ? 'success' : op.status === 'SUSPENDED' ? 'danger' : 'warning'}
                label={op.status}
              />
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 40, maxWidth: 1000, alignSelf: 'center', width: '100%' },
  containerMobile: { padding: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 8 },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  kpiGridMobile: { flexDirection: 'column' },
  kpiCard: { flex: 1, minWidth: 140 },
  kpiIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  kpiLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiValue: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  kpiSub: { fontSize: 11, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  opRow: { marginBottom: 8 },
  opRowInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  opName: { fontSize: 14, fontWeight: '700' },
  opMeta: { fontSize: 12, marginTop: 2 },
});
