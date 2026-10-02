import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
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
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const html5QrCodeRef = useRef<any>(null);
  const isScanningRef = useRef<boolean>(false);

  // Load Html5Qrcode library dynamically from CDN
  const loadHtml5QrcodeScript = (onLoaded: () => void) => {
    if (typeof window === 'undefined') return;
    if ((window as any).Html5Qrcode) {
      onLoaded();
      return;
    }
    if (!document.getElementById('html5-qrcode-bundle')) {
      const script = document.createElement('script');
      script.id = 'html5-qrcode-bundle';
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      script.async = true;
      script.onload = () => onLoaded();
      document.head.appendChild(script);
    } else {
      document.getElementById('html5-qrcode-bundle')?.addEventListener('load', onLoaded);
    }
  };

  // Play audio beep confirmation upon successful QR scan
  const playScanBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {}
  };

  // Handler when QR is detected from camera stream
  const handleQrDetected = async (decodedText: string) => {
    if (!decodedText || isScanningRef.current) return;
    isScanningRef.current = true;
    setLastScannedCode(decodedText);
    setManualTicketInput(decodedText);
    playScanBeep();

    try {
      await validateTicket(decodedText.trim());
    } catch (err: any) {
      console.warn('Scan auto-validation notice:', err);
    } finally {
      // Allow next scan after small debounce
      setTimeout(() => {
        isScanningRef.current = false;
      }, 2000);
    }
  };

  // Start real camera stream
  const startCamera = () => {
    setCameraLoading(true);
    setCameraError(null);

    loadHtml5QrcodeScript(async () => {
      try {
        const Html5QrcodeClass = (window as any).Html5Qrcode;
        if (!Html5QrcodeClass) {
          throw new Error('QR Scanner engine could not be loaded');
        }

        const readerId = 'conductor-camera-viewport';
        if (!document.getElementById(readerId)) {
          throw new Error('Camera viewport element not ready');
        }

        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop();
          } catch {}
        }

        const scanner = new Html5QrcodeClass(readerId);
        html5QrCodeRef.current = scanner;

        const config = {
          fps: 15,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        };

        await scanner.start(
          { facingMode },
          config,
          (decodedText: string) => {
            handleQrDetected(decodedText);
          },
          () => {
            // Frame miss, normal loop
          }
        );

        setIsCameraActive(true);
      } catch (err: any) {
        console.error('Camera startup error:', err);
        setCameraError(
          err?.message || 'Camera permission denied or camera not found on this device.'
        );
        setIsCameraActive(false);
      } finally {
        setCameraLoading(false);
      }
    });
  };

  // Stop camera stream
  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch {}
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop();
          }
        } catch {}
      }
    };
  }, []);

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

      {/* 2. Real Camera QR Reticle Viewfinder */}
      <Card
        padding={18}
        style={[
          styles.reticleCard,
          {
            backgroundColor: isLight ? '#0f172a' : '#030712',
            borderColor: brandColors.primary,
          },
        ]}
      >
        <View style={styles.reticleHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Badge
              variant={isCameraActive ? 'success' : 'neutral'}
              label={isCameraActive ? '● CAMERA LIVE' : 'CAMERA STANDBY'}
            />
            {isCameraActive && (
              <Badge variant="mint" label={`MODE: ${facingMode.toUpperCase()}`} size="sm" />
            )}
          </View>
          <Text style={styles.busBadgeText}>
            {activeTrip?.busRegistrationNumber || 'Commercial Bus'}
          </Text>
        </View>

        {/* Live Camera Viewport DOM Container */}
        <View style={styles.cameraViewportWrapper}>
          {Platform.OS === 'web' ? (
            <div
              id="conductor-camera-viewport"
              style={{
                width: '100%',
                maxWidth: 420,
                minHeight: isCameraActive ? 280 : 0,
                borderRadius: 14,
                overflow: 'hidden',
                backgroundColor: '#000000',
                display: isCameraActive ? 'block' : 'none',
              }}
            />
          ) : null}

          {/* If Camera is not active, show the Scanner Reticle & Launch Button */}
          {!isCameraActive && (
            <View style={styles.viewfinderContainer}>
              <View style={styles.viewfinderFrame}>
                <View style={[styles.cornerBracket, styles.topLeft]} />
                <View style={[styles.cornerBracket, styles.topRight]} />
                <View style={[styles.cornerBracket, styles.bottomLeft]} />
                <View style={[styles.cornerBracket, styles.bottomRight]} />

                <Text style={{ fontSize: 36, marginBottom: 8 }}>📷</Text>
                <Text style={styles.reticleInstructions}>
                  Ready to scan passenger QR ticket
                </Text>
              </View>
            </View>
          )}

          {/* Camera Error Alert */}
          {cameraError && (
            <View style={styles.cameraErrorBanner}>
              <Text style={styles.cameraErrorText}>⚠️ {cameraError}</Text>
            </View>
          )}
        </View>

        {/* Scanner Control Actions */}
        <View style={styles.cameraControlsRow}>
          {!isCameraActive ? (
            <Button
              title={cameraLoading ? 'Starting Camera...' : '📷 Start Live Camera Scanner'}
              variant="mint"
              size="md"
              onPress={startCamera}
              isLoading={cameraLoading}
              style={{ minWidth: 200 }}
            />
          ) : (
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              <Button
                title="⏹ Stop Camera"
                variant="outline"
                size="md"
                onPress={stopCamera}
              />
              <Button
                title={facingMode === 'environment' ? '🔄 Switch to Front' : '🔄 Switch to Back'}
                variant="secondary"
                size="md"
                onPress={() => {
                  const newMode = facingMode === 'environment' ? 'user' : 'environment';
                  setFacingMode(newMode);
                  stopCamera().then(() => {
                    setTimeout(() => startCamera(), 200);
                  });
                }}
              />
            </View>
          )}
        </View>

        {lastScannedCode && (
          <View style={styles.lastScannedBadge}>
            <Text style={styles.lastScannedLabel}>LAST SCANNED PAYLOAD:</Text>
            <Text style={styles.lastScannedText} numberOfLines={1}>
              {lastScannedCode}
            </Text>
          </View>
        )}
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
  cameraViewportWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  cameraControlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    width: '100%',
  },
  cameraErrorBanner: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 8,
    width: '100%',
    maxWidth: 420,
  },
  cameraErrorText: {
    color: '#f87171',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  lastScannedBadge: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(0, 212, 136, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 136, 0.3)',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  lastScannedLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00D488',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  lastScannedText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    color: '#ffffff',
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
  reticleInstructions: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
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
