import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../theme';
import { Modal, Button } from '../../../components/common';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { colors, isLight } = useTheme();
  const [routeOptimization, setRouteOptimization] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Privacy & Consent"
      subtitle="Data privacy & telemetry preferences"
      icon="🛡️"
      maxWidth={480}
    >
      <View style={styles.container}>
        {/* Transit Route Optimization */}
        <TouchableOpacity
          onPress={() => setRouteOptimization(!routeOptimization)}
          style={[
            styles.preferenceCard,
            {
              backgroundColor: isLight ? '#ffffff' : '#1e293b',
              borderColor: isLight ? '#e2e8f0' : '#334155',
            },
          ]}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[styles.prefTitle, { color: colors.textPrimary }]}>
              Transit Route Optimization
            </Text>
            <Text style={[styles.prefDesc, { color: colors.textSecondary }]}>
              Allow anonymized trip search telemetry to optimize bus frequencies.
            </Text>
          </View>
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: routeOptimization ? '#00D488' : 'transparent',
                borderColor: routeOptimization ? '#00D488' : (isLight ? '#cbd5e1' : '#475569'),
              },
            ]}
          >
            {routeOptimization && <Text style={styles.checkboxCheck}>✓</Text>}
          </View>
        </TouchableOpacity>

        {/* Emergency Corridor Alerts */}
        <TouchableOpacity
          onPress={() => setEmergencyAlerts(!emergencyAlerts)}
          style={[
            styles.preferenceCard,
            {
              backgroundColor: isLight ? '#ffffff' : '#1e293b',
              borderColor: isLight ? '#e2e8f0' : '#334155',
            },
          ]}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[styles.prefTitle, { color: colors.textPrimary }]}>
              Emergency Corridor Alerts
            </Text>
            <Text style={[styles.prefDesc, { color: colors.textSecondary }]}>
              Receive real-time weather and road-closure notifications.
            </Text>
          </View>
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: emergencyAlerts ? '#00D488' : 'transparent',
                borderColor: emergencyAlerts ? '#00D488' : (isLight ? '#cbd5e1' : '#475569'),
              },
            ]}
          >
            {emergencyAlerts && <Text style={styles.checkboxCheck}>✓</Text>}
          </View>
        </TouchableOpacity>

        {/* Essential Ticket Tokens */}
        <View
          style={[
            styles.preferenceCard,
            {
              backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)',
              borderColor: isLight ? '#e2e8f0' : '#334155',
            },
          ]}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[styles.prefTitle, { color: colors.textPrimary }]}>
              Essential Ticket Tokens (Strictly Necessary)
            </Text>
            <Text style={[styles.prefDesc, { color: colors.textMuted }]}>
              Cryptographic authentication and secure session tokens.
            </Text>
          </View>
          <View
            style={[
              styles.lockedBadge,
              { backgroundColor: isLight ? '#e2e8f0' : '#334155' },
            ]}
          >
            <Text style={[styles.lockedText, { color: colors.textSecondary }]}>
              LOCKED
            </Text>
          </View>
        </View>

        <Button
          title="Save Preferences"
          variant="primary"
          size="lg"
          onPress={onClose}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  preferenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  prefDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheck: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  lockedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lockedText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
