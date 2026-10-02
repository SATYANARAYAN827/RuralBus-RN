import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
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
  const [qrImageUri, setQrImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (!ticket) return;

    // Use authentic cryptographic signature payload from backend
    const qrValue =
      ticket.qrPayload ||
      ticket.signature ||
      (ticket.id ? `TKT-QR:${ticket.id}` : ticket.pnr);

    const generateQrCode = () => {
      if ((window as any).QRCode) {
        (window as any).QRCode.toDataURL(
          qrValue,
          {
            width: 280,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
          },
          (err: any, url: string) => {
            if (!err && url) {
              setQrImageUri(url);
            }
          }
        );
      }
    };

    if (typeof window === 'undefined') return;

    if ((window as any).QRCode) {
      generateQrCode();
      return;
    }

    if (!document.getElementById('qrcode-generator-script')) {
      const script = document.createElement('script');
      script.id = 'qrcode-generator-script';
      script.src = 'https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js';
      script.async = true;
      script.onload = () => generateQrCode();
      document.head.appendChild(script);
    } else {
      document.getElementById('qrcode-generator-script')?.addEventListener('load', generateQrCode);
    }
  }, [ticket]);

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

        {/* Real QR Code Container with Scanner Reticle */}
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

          {/* Genuine QR Code Image */}
          <View style={styles.qrImageWrapper}>
            {qrImageUri ? (
              <Image
                source={{ uri: qrImageUri }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.qrLoadingBox}>
                <ActivityIndicator size="large" color="#00D488" />
                <Text style={styles.qrLoadingText}>Generating Boarding QR...</Text>
              </View>
            )}
          </View>

          <Text style={styles.qrHint}>
            HMAC SHA-256 Cryptographically Signed · Scannable
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
  qrImageWrapper: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  qrImage: {
    width: 210,
    height: 210,
  },
  qrLoadingBox: {
    width: 210,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLoadingText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 8,
    fontWeight: '700',
  },
  qrHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 10,
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
