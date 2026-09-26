import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { Modal, Button, Badge } from '../../components/common';
import { PassengerTicket } from '../../types';

interface QrTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: PassengerTicket | null;
  onTrackTrip?: (tripId: string) => void;
}

export const QrTicketModal: React.FC<QrTicketModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onTrackTrip,
}) => {
  const { colors, isLight } = useTheme();

  if (!ticket) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Digital Boarding Pass"
      subtitle="Present to Conductor Upon Boarding"
      icon="🎫"
      maxWidth={460}
    >
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* PNR Banner */}
        <View
          style={[
            styles.pnrBanner,
            {
              backgroundColor: isLight ? '#ecfdf5' : 'rgba(0, 212, 136, 0.12)',
              borderColor: '#a7f3d0',
            },
          ]}
        >
          <View>
            <Text style={[styles.pnrLabel, { color: colors.textSecondary }]}>
              BOOKING PNR
            </Text>
            <Text style={styles.pnrCode}>{ticket.pnr}</Text>
          </View>
          <Badge variant="success" label={ticket.status} />
        </View>

        {/* QR Code Container with Reticle */}
        <View
          style={[
            styles.qrContainer,
            {
              backgroundColor: '#ffffff',
              borderColor: isLight ? '#cbd5e1' : '#475569',
            },
          ]}
        >
          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* QR Code Graphic Matrix simulation */}
          <View style={styles.qrMatrix}>
            <View style={styles.qrRow}>
              <View style={[styles.qrEye, { borderColor: '#0f172a' }]}>
                <View style={[styles.qrEyeInner, { backgroundColor: '#0f172a' }]} />
              </View>
              <View style={styles.qrBarGroup}>
                <View style={[styles.qrBlock, { backgroundColor: '#0f172a' }]} />
                <View style={[styles.qrBlock, { backgroundColor: 'transparent' }]} />
                <View style={[styles.qrBlock, { backgroundColor: '#0f172a' }]} />
              </View>
              <View style={[styles.qrEye, { borderColor: '#0f172a' }]}>
                <View style={[styles.qrEyeInner, { backgroundColor: '#0f172a' }]} />
              </View>
            </View>

            <View style={styles.qrMidRow}>
              <View style={[styles.qrBlock, { backgroundColor: '#0f172a', width: 24, height: 16 }]} />
              <View style={[styles.qrBlock, { backgroundColor: '#00D488', width: 44, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 14 }}>🚌</Text>
              </View>
              <View style={[styles.qrBlock, { backgroundColor: '#0f172a', width: 24, height: 16 }]} />
            </View>

            <View style={styles.qrRow}>
              <View style={[styles.qrEye, { borderColor: '#0f172a' }]}>
                <View style={[styles.qrEyeInner, { backgroundColor: '#0f172a' }]} />
              </View>
              <View style={styles.qrBarGroup}>
                <View style={[styles.qrBlock, { backgroundColor: '#0f172a' }]} />
                <View style={[styles.qrBlock, { backgroundColor: '#0f172a' }]} />
                <View style={[styles.qrBlock, { backgroundColor: 'transparent' }]} />
              </View>
              <View style={[styles.qrEye, { borderColor: '#0f172a', opacity: 0.8 }]}>
                <View style={[styles.qrEyeInner, { backgroundColor: '#047857' }]} />
              </View>
            </View>
          </View>

          <Text style={styles.qrHint}>
            Ed25519 Cryptographically Signed · Offline Valid
          </Text>
        </View>

        {/* Journey Details */}
        <View
          style={[
            styles.ticketDetails,
            {
              backgroundColor: isLight ? '#f8fafc' : '#1e293b',
              borderColor: isLight ? '#e2e8f0' : '#334155',
            },
          ]}
        >
          <View style={styles.routeHeader}>
            <Text style={[styles.routeTitle, { color: colors.textPrimary }]}>
              {ticket.origin} ➔ {ticket.destination}
            </Text>
            <Text style={[styles.busReg, { color: colors.textSecondary }]}>
              {ticket.busRegistration} ({ticket.operatorName})
            </Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>SEATS</Text>
              <Text style={[styles.infoVal, { color: '#047857' }]}>
                {ticket.seatNumbers.join(', ')}
              </Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>DEPARTURE</Text>
              <Text style={[styles.infoVal, { color: colors.textPrimary }]}>
                {ticket.departureTime}
              </Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>DATE</Text>
              <Text style={[styles.infoVal, { color: colors.textPrimary }]}>
                {ticket.journeyDate}
              </Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>COMMUTER</Text>
              <Text style={[styles.infoVal, { color: colors.textPrimary }]}>
                {ticket.passengerName}
              </Text>
            </View>
          </View>

          <View style={styles.sigBox}>
            <Text style={[styles.sigLabel, { color: colors.textMuted }]}>
              SIGNATURE HASH
            </Text>
            <Text style={[styles.sigHash, { color: colors.textSecondary }]}>
              {ticket.signature}
            </Text>
          </View>
        </View>

        {/* Action CTAs */}
        <View style={{ gap: 10 }}>
          {onTrackTrip && (
            <Button
              title="Track Live Bus on Map 📡"
              variant="mint"
              size="lg"
              onPress={() => {
                onClose();
                onTrackTrip(ticket.tripId);
              }}
            />
          )}

          <Button
            title="Done / Close"
            variant="outline"
            size="md"
            onPress={onClose}
          />
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    maxHeight: 520,
  },
  pnrBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  pnrLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pnrCode: {
    fontSize: 18,
    fontWeight: '900',
    color: '#047857',
    marginTop: 2,
  },
  qrContainer: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 14,
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: '#00D488',
  },
  cornerTL: { top: 10, left: 10, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 10, right: 10, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 10, left: 10, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 10, right: 10, borderBottomWidth: 3, borderRightWidth: 3 },
  qrMatrix: {
    width: 160,
    height: 160,
    justifyContent: 'space-between',
    padding: 4,
  },
  qrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrMidRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  qrEye: {
    width: 44,
    height: 44,
    borderWidth: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrEyeInner: {
    width: 20,
    height: 20,
    borderRadius: 3,
  },
  qrBarGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  qrBlock: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  qrHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 14,
    letterSpacing: 0.3,
  },
  ticketDetails: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  routeHeader: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  busReg: {
    fontSize: 11,
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  infoCol: {
    minWidth: 80,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  sigBox: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  sigLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  sigHash: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
});
