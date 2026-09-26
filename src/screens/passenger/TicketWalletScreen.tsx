import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme';
import { Card, Button, Badge, EmptyState } from '../../components/common';
import { usePassengerStore } from '../../stores/passenger.store';
import { PassengerTicket } from '../../types';

interface TicketWalletScreenProps {
  onOpenQrModal: (ticket: PassengerTicket) => void;
  onOpenLiveTrack: (tripId: string) => void;
  onGoToSearch: () => void;
}

export const TicketWalletScreen: React.FC<TicketWalletScreenProps> = ({
  onOpenQrModal,
  onOpenLiveTrack,
  onGoToSearch,
}) => {
  const { colors, isLight } = useTheme();
  const { tickets, loadTickets, isLoadingTickets, selectTicket } = usePassengerStore();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const activeTickets = tickets.filter(
    (t) => t.status === 'CONFIRMED' || t.status === 'BOARDED'
  );
  const historyTickets = tickets.filter(
    (t) => t.status === 'COMPLETED' || t.status === 'CANCELLED'
  );

  const displayList = activeTab === 'ACTIVE' ? activeTickets : historyTickets;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.headerSection}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Digital Boarding Pass & E-Tickets
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Official valid electronic travel document. Present QR code to the on-duty conductor upon boarding.
        </Text>
      </View>

      {/* Tabs Filter */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => setActiveTab('ACTIVE')}
          style={[
            styles.tabBtn,
            {
              backgroundColor: activeTab === 'ACTIVE' ? '#ecfdf5' : (isLight ? '#f8fafc' : '#1e293b'),
              borderColor: activeTab === 'ACTIVE' ? '#00D488' : (isLight ? '#cbd5e1' : '#334155'),
            },
          ]}
        >
          <Text
            style={[
              styles.tabBtnText,
              { color: activeTab === 'ACTIVE' ? '#047857' : colors.textSecondary },
            ]}
          >
            Active Passes ({activeTickets.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('HISTORY')}
          style={[
            styles.tabBtn,
            {
              backgroundColor: activeTab === 'HISTORY' ? '#ecfdf5' : (isLight ? '#f8fafc' : '#1e293b'),
              borderColor: activeTab === 'HISTORY' ? '#00D488' : (isLight ? '#cbd5e1' : '#334155'),
            },
          ]}
        >
          <Text
            style={[
              styles.tabBtnText,
              { color: activeTab === 'HISTORY' ? '#047857' : colors.textSecondary },
            ]}
          >
            Completed Journeys ({historyTickets.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tickets List */}
      {displayList.length === 0 ? (
        <EmptyState
          icon="🎫"
          title={activeTab === 'ACTIVE' ? 'No Active Boarding Passes' : 'No Completed Trips Yet'}
          description={
            activeTab === 'ACTIVE'
              ? 'You do not have any upcoming bus journeys booked. Search corridors and reserve your seats now.'
              : 'Past completed trip receipts and travel history will appear here.'
          }
          action={{
            label: 'Book a Bus Ticket ➔',
            onPress: onGoToSearch,
          }}
        />
      ) : (
        <View style={styles.ticketsList}>
          {displayList.map((ticket) => (
            <Card key={ticket.id} padding={16} style={styles.ticketCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.routeText, { color: colors.textPrimary }]}>
                    {ticket.origin} ➔ {ticket.destination}
                  </Text>
                  <Text style={[styles.pnrBadge, { color: colors.textSecondary }]}>
                    PNR: <Text style={{ color: '#047857', fontWeight: '800' }}>{ticket.pnr}</Text>
                  </Text>
                </View>
                <Badge variant={ticket.status === 'CONFIRMED' ? 'success' : 'neutral'} label={ticket.status} />
              </View>

              <View style={styles.busInfoRow}>
                <Text style={[styles.busRegText, { color: colors.textSecondary }]}>
                  🚌 {ticket.busRegistration} · {ticket.operatorName}
                </Text>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.gridItem}>
                  <Text style={[styles.gridLabel, { color: colors.textMuted }]}>DATE</Text>
                  <Text style={[styles.gridVal, { color: colors.textPrimary }]}>
                    {ticket.journeyDate}
                  </Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={[styles.gridLabel, { color: colors.textMuted }]}>DEPARTURE</Text>
                  <Text style={[styles.gridVal, { color: colors.textPrimary }]}>
                    {ticket.departureTime}
                  </Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={[styles.gridLabel, { color: colors.textMuted }]}>SEATS</Text>
                  <Text style={[styles.gridVal, { color: '#047857' }]}>
                    {ticket.seatNumbers.join(', ')}
                  </Text>
                </View>

                <View style={styles.gridItem}>
                  <Text style={[styles.gridLabel, { color: colors.textMuted }]}>PAID</Text>
                  <Text style={[styles.gridVal, { color: colors.textPrimary }]}>
                    ₹{ticket.totalFare}
                  </Text>
                </View>
              </View>

              {/* Actions Row */}
              <View style={styles.actionsRow}>
                <Button
                  title="📱 View QR Code"
                  variant="primary"
                  size="md"
                  onPress={() => {
                    selectTicket(ticket);
                    onOpenQrModal(ticket);
                  }}
                />

                <Button
                  title="📡 Track Live Bus"
                  variant="mint"
                  size="md"
                  onPress={() => {
                    selectTicket(ticket);
                    onOpenLiveTrack(ticket.tripId);
                  }}
                />
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 18,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ticketsList: {
    gap: 14,
    marginBottom: 30,
  },
  ticketCard: {
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  pnrBadge: {
    fontSize: 12,
    marginTop: 2,
  },
  busInfoRow: {
    marginBottom: 12,
  },
  busRegText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 14,
  },
  gridItem: {
    alignItems: 'flex-start',
  },
  gridLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gridVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});
