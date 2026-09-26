/**
 * Operator Revenue Screen
 * Authoritative endpoint: GET /api/v1/operator/revenue
 *
 * Requirements:
 * - Authoritative backend values only direct from Fastify ledger
 * - Clearly distinguishes digital revenue from cash POS collections
 * - Displays authoritative totals (totalRevenue, totalPassengers)
 * - Zero replacement math or fabricated estimates
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Card, Badge, Button, LoadingIndicator, ErrorState } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useOperatorStore } from '../../stores/operator.store';

export const OperatorRevenueScreen: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    revenueReport,
    isLoadingRevenue,
    revenueError,
    fetchRevenue,
  } = useOperatorStore();

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, isMobile && styles.mobileContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Screen Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            Revenue & Collections
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
            Authoritative ticket booking collections and conductor settlements
          </Text>
        </View>

        <Button
          title="↻ Refresh"
          variant="outline"
          size="sm"
          isLoading={isLoadingRevenue}
          onPress={fetchRevenue}
        />
      </View>

      {/* 2. Loading / Error States */}
      {isLoadingRevenue && !revenueReport && (
        <Card padding={24} style={styles.stateCard}>
          <LoadingIndicator message="Loading authoritative revenue ledger..." />
        </Card>
      )}

      {revenueError && (
        <Card padding={16} style={[styles.stateCard, { borderColor: '#ef4444' }]}>
          <ErrorState
            title="Failed to Load Revenue Data"
            message={revenueError}
            retryLabel="Retry"
            onRetry={fetchRevenue}
          />
        </Card>
      )}

      {/* 3. Main Revenue Display */}
      {revenueReport && (
        <>
          {/* Total Revenue Highlight Card */}
          <Card
            padding={20}
            style={[
              styles.totalCard,
              {
                backgroundColor: isLight ? '#0f172a' : '#090d16',
                borderColor: 'rgba(0, 212, 136, 0.4)',
              },
            ]}
          >
            <View style={styles.totalBadgeRow}>
              <Badge label="AUTHORITATIVE LEDGER" variant="mint" size="sm" />
              <Badge label="VERIFIED" variant="neutral" size="sm" />
            </View>

            <Text style={styles.totalLabel}>AGGREGATE FLEET REVENUE</Text>
            <Text style={styles.totalAmount}>
              ₹{revenueReport.totalRevenue.toLocaleString()}
            </Text>

            <View style={styles.totalMetaRow}>
              <Text style={styles.totalMetaItem}>
                👥 {revenueReport.totalPassengers} Verified Passengers
              </Text>
              <Text style={styles.totalMetaItem}>
                🚌 {revenueReport.activeBuses} of {revenueReport.totalBuses} Buses Active
              </Text>
              <Text style={styles.totalMetaItem}>
                👨‍✈️ {revenueReport.totalStaff} Crew Members
              </Text>
            </View>

            <Text style={styles.generatedAtText}>
              Generated at: {new Date(revenueReport.generatedAt).toLocaleString()}
            </Text>
          </Card>

          {/* Breakdown: Digital vs Cash POS Cards */}
          <View style={[styles.breakdownRow, isMobile && styles.mobileBreakdownRow]}>
            {/* Digital Revenue Card */}
            <Card
              padding={18}
              style={[
                styles.channelCard,
                {
                  backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)',
                },
              ]}
            >
              <View style={styles.channelHeader}>
                <Text style={styles.channelIcon}>💳</Text>
                <Badge label="ONLINE / UPI" variant="mint" size="sm" />
              </View>

              <Text style={[styles.channelTitle, { color: colors.textPrimary }]}>
                Digital Bookings
              </Text>
              <Text style={[styles.channelSub, { color: colors.textSecondary }]}>
                Passenger mobile app bookings, UPI & Card gateways
              </Text>

              <View style={styles.channelMetricBox}>
                <Text style={styles.metricLabel}>DIGITAL REVENUE</Text>
                <Text style={[styles.metricValue, { color: '#00D488' }]}>
                  ₹{revenueReport.onlineRevenue.toLocaleString()}
                </Text>
              </View>

              <View style={styles.channelStatsRow}>
                <Text style={[styles.channelStatText, { color: colors.textSecondary }]}>
                  Confirmed Tickets: <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{revenueReport.onlineTicketCount}</Text>
                </Text>
              </View>
            </Card>

            {/* Cash POS Revenue Card */}
            <Card
              padding={18}
              style={[
                styles.channelCard,
                {
                  backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)',
                },
              ]}
            >
              <View style={styles.channelHeader}>
                <Text style={styles.channelIcon}>💵</Text>
                <Badge label="CASH POS" variant="info" size="sm" />
              </View>

              <Text style={[styles.channelTitle, { color: colors.textPrimary }]}>
                Conductor Cash POS
              </Text>
              <Text style={[styles.channelSub, { color: colors.textSecondary }]}>
                On-bus offline & synced cash tickets issued by conductors
              </Text>

              <View style={styles.channelMetricBox}>
                <Text style={styles.metricLabel}>CASH COLLECTIONS</Text>
                <Text style={[styles.metricValue, { color: '#38bdf8' }]}>
                  ₹{revenueReport.cashRevenue.toLocaleString()}
                </Text>
              </View>

              <View style={styles.channelStatsRow}>
                <Text style={[styles.channelStatText, { color: colors.textSecondary }]}>
                  Cash Tickets Issued: <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{revenueReport.cashTicketCount}</Text>
                </Text>
              </View>
            </Card>
          </View>
        </>
      )}
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
  stateCard: {
    borderRadius: 12,
  },
  totalCard: {
    borderRadius: 14,
    borderWidth: 1.5,
  },
  totalBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#94a3b8',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#00D488',
    letterSpacing: -1,
  },
  totalMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
  },
  totalMetaItem: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  generatedAtText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 14,
  },
  mobileBreakdownRow: {
    flexDirection: 'column',
    gap: 12,
  },
  channelCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  channelIcon: {
    fontSize: 22,
  },
  channelTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  channelSub: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 14,
    lineHeight: 16,
  },
  channelMetricBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  channelStatsRow: {
    paddingTop: 4,
  },
  channelStatText: {
    fontSize: 12,
  },
});
