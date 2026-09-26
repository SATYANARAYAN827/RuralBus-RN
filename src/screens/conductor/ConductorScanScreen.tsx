import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Card, Badge, Button, TextInput } from '../../components/common';
import { useTheme } from '../../theme';
import { useResponsive } from '../../theme/useResponsive';
import { useConductorStore } from '../../stores/conductor.store';
import { ConductorValidationModal } from './modals/ConductorValidationModal';

export const ConductorScanScreen: React.FC = () => {
  const { colors, brandColors, isLight } = useTheme();
  const { isMobile } = useResponsive();
  const {
    manualTicketInput,
    setManualTicketInput,
    validateTicket,
    isValidatingTicket,
    activeTrip,
    manifest,
  } = useConductorStore();

  const [inputError, setInputError] = useState<string | null>(null);

  const handleValidate = async () => {
    if (!manualTicketInput.trim()) {
      setInputError('Please enter a ticket number or QR data');
      return;
    }
    setInputError(null);
    try {
      await validateTicket(manualTicketInput.trim());
    } catch {
      // Error handled in store and validation modal
    }
  };

  const handleQuickFill = (ticketId: string) => {
    setManualTicketInput(ticketId);
    setInputError(null);
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, isMobile && styles.mobileContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Information */}
      <Card
        padding={14}
        style={[
          styles.headerCard,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            High-Speed QR Ticket Validator
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            HMAC cryptographic signature verification · Real-time boarding check
          </Text>
        </View>
        <Badge variant="mint" label="ONLINE HUD" />
      </Card>

      {/* 2. Camera QR Reticle Viewfinder Simulation / Native Camera HUD */}
      <Card
        padding={20}
        style={[
          styles.reticleCard,
          {
            backgroundColor: isLight ? '#0f172a' : '#030712',
            borderColor: brandColors.primary,
          },
        ]}
      >
        <View style={styles.reticleHeader}>
          <Badge variant="info" label="CAMERA VIEWFINDER" />
          <Text style={styles.busBadgeText}>
            {activeTrip?.busRegistrationNumber || 'Commercial Bus'}
          </Text>
        </View>

        {/* Viewfinder Target Frame */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinderFrame}>
            {/* 4 Glowing Corner Brackets */}
            <View style={[styles.cornerBracket, styles.topLeft]} />
            <View style={[styles.cornerBracket, styles.topRight]} />
            <View style={[styles.cornerBracket, styles.bottomLeft]} />
            <View style={[styles.cornerBracket, styles.bottomRight]} />

            {/* Scanning Line Indicator */}
            <View style={styles.scanLine} />

            <Text style={styles.reticleInstructions}>
              Align Passenger QR within frame
            </Text>
          </View>
        </View>

        <Text style={styles.hardwareNote}>
          Hardware Camera Interface: On physical device builds with camera permissions granted, the live camera stream actively scans tickets. Use the manual validator below for direct PNR lookup or in automated environments.
        </Text>
      </Card>

      {/* 3. Manual PNR / Ticket ID Input */}
      <Card
        padding={18}
        style={[
          styles.inputCard,
          {
            backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.inputHeading, { color: colors.textPrimary }]}>
          Manual Ticket or QR Data Validation
        </Text>
        <Text style={[styles.inputSub, { color: colors.textSecondary }]}>
          Enter 8-digit PNR ticket code or paste raw cryptographic QR payload
        </Text>

        <TextInput
          label="TICKET CODE / QR PAYLOAD"
          placeholder="e.g. GB-1001 or TKT-QR:payload"
          value={manualTicketInput}
          onChangeText={(text) => {
            setManualTicketInput(text);
            if (inputError) setInputError(null);
          }}
          leftIcon="🎫"
          error={inputError || undefined}
        />

        <Button
          title={isValidatingTicket ? 'Verifying with Backend...' : 'Validate & Board Passenger'}
          variant="primary"
          size="lg"
          icon="✓"
          onPress={handleValidate}
          isLoading={isValidatingTicket}
          style={{ marginTop: 8 }}
        />
      </Card>

      {/* 4. Quick Manifest Roster Candidates */}
      {manifest.length > 0 && (
        <Card
          padding={16}
          style={[
            styles.manifestQuickCard,
            {
              backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.quickHeading, { color: colors.textPrimary }]}>
            Awaiting Passengers on Current Manifest ({manifest.filter((m) => !m.isBoarded).length})
          </Text>
          <Text style={[styles.quickSub, { color: colors.textSecondary }]}>
            Tap any ticket below to quickly autofill for validation:
          </Text>

          <View style={styles.chipRow}>
            {manifest
              .filter((m) => !m.isBoarded)
              .slice(0, 6)
              .map((passenger) => (
                <TouchableOpacity
                  key={passenger.ticketId}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleQuickFill(passenger.ticketId)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, { color: colors.textPrimary }]}>
                    #{passenger.seatNumber} · {passenger.passengerName}
                  </Text>
                  <Text style={[styles.chipCode, { color: brandColors.primary }]}>
                    {passenger.ticketNumber}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </Card>
      )}

      {/* Validation Result Modal */}
      <ConductorValidationModal />
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
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    flexWrap: 'wrap',
    gap: 10,
  },
  headerLeft: {
    flex: 1,
    minWidth: 240,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  reticleCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 16,
  },
  reticleHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  busBadgeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  viewfinderContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 18,
  },
  viewfinderFrame: {
    width: 220,
    height: 220,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 136, 0.3)',
    borderRadius: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 212, 136, 0.03)',
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#00D488',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    width: '85%',
    height: 2,
    backgroundColor: '#00D488',
    shadowColor: '#00D488',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 8,
  },
  reticleInstructions: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  hardwareNote: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    maxWidth: 520,
  },
  inputCard: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  inputHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  inputSub: {
    fontSize: 12,
    marginBottom: 4,
  },
  manifestQuickCard: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  quickHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  quickSub: {
    fontSize: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipCode: {
    fontSize: 11,
    fontWeight: '900',
  },
});
