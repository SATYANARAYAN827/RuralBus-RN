/**
 * Add Staff Member Modal (Driver / Conductor)
 * Provisions operational crew members under the current operator tenant.
 * Security: Passwords are encrypted over HTTPS; zero plaintext passwords persisted or logged.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Modal, Button, TextInput } from '../../../components/common';
import { useTheme } from '../../../theme';
import { useOperatorStore } from '../../../stores/operator.store';

export const AddStaffModal: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { isAddStaffModalOpen, setIsAddStaffModalOpen, createStaff, buses, isLoadingStaff } = useOperatorStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'DRIVER' | 'CONDUCTOR'>('DRIVER');
  const [password, setPassword] = useState('');
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const activeBuses = buses.filter((b) => b.status === 'ACTIVE');

  const handleCreate = async () => {
    setFormError(null);

    if (fullName.trim().length < 2) {
      setFormError('Full name must be at least 2 characters');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setFormError('Phone number must be a valid 10-digit Indian mobile starting with 6-9');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }

    const success = await createStaff({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase() || undefined,
      role,
      password,
      busId: selectedBusId,
    });

    if (success) {
      setFullName('');
      setPhone('');
      setEmail('');
      setPassword('');
      setSelectedBusId(null);
      setIsAddStaffModalOpen(false);
    }
  };

  return (
    <Modal
      isOpen={isAddStaffModalOpen}
      onClose={() => setIsAddStaffModalOpen(false)}
      title="Provision Staff Member"
      subtitle="Register new Driver or Conductor with tenant credentials"
      icon="👥"
      actions={
        <>
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            onPress={() => setIsAddStaffModalOpen(false)}
          />
          <Button
            title={isLoadingStaff ? 'Provisioning...' : 'Provision Staff'}
            variant="primary"
            size="md"
            isLoading={isLoadingStaff}
            onPress={handleCreate}
          />
        </>
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
        {formError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {formError}</Text>
          </View>
        )}

        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>OPERATIONAL ROLE *</Text>
        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[
              styles.roleCard,
              {
                backgroundColor: role === 'DRIVER'
                  ? 'rgba(0, 212, 136, 0.15)'
                  : isLight
                  ? '#f8fafc'
                  : 'rgba(255,255,255,0.04)',
                borderColor: role === 'DRIVER' ? '#00D488' : 'transparent',
                borderWidth: 1.5,
              },
            ]}
            onPress={() => setRole('DRIVER')}
          >
            <Text style={styles.roleIcon}>👨‍✈️</Text>
            <Text
              style={[
                styles.roleTitle,
                { color: role === 'DRIVER' ? '#00D488' : colors.textPrimary },
              ]}
            >
              DRIVER
            </Text>
            <Text style={styles.roleDesc}>Operates bus, vehicle telemetry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleCard,
              {
                backgroundColor: role === 'CONDUCTOR'
                  ? 'rgba(0, 212, 136, 0.15)'
                  : isLight
                  ? '#f8fafc'
                  : 'rgba(255,255,255,0.04)',
                borderColor: role === 'CONDUCTOR' ? '#00D488' : 'transparent',
                borderWidth: 1.5,
              },
            ]}
            onPress={() => setRole('CONDUCTOR')}
          >
            <Text style={styles.roleIcon}>🎫</Text>
            <Text
              style={[
                styles.roleTitle,
                { color: role === 'CONDUCTOR' ? '#00D488' : colors.textPrimary },
              ]}
            >
              CONDUCTOR
            </Text>
            <Text style={styles.roleDesc}>Validates QR tickets, cash POS</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          label="FULL NAME *"
          placeholder="e.g. Ramesh Kumar Sahoo"
          value={fullName}
          onChangeText={setFullName}
          style={styles.field}
        />

        <TextInput
          label="MOBILE PHONE (10 DIGITS) *"
          placeholder="e.g. 9876543210"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
          style={styles.field}
        />

        <TextInput
          label="EMAIL ADDRESS (OPTIONAL)"
          placeholder="e.g. ramesh@ruralbus.in"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.field}
        />

        <TextInput
          label="INITIAL PASSWORD (MIN 8 CHARACTERS) *"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.field}
        />

        <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 4 }]}>
          ASSIGN INITIAL BUS (OPTIONAL)
        </Text>
        <View style={styles.pillRow}>
          <TouchableOpacity
            style={[
              styles.pill,
              {
                backgroundColor: selectedBusId === null
                  ? '#00D488'
                  : isLight
                  ? '#f1f5f9'
                  : 'rgba(255,255,255,0.08)',
              },
            ]}
            onPress={() => setSelectedBusId(null)}
          >
            <Text
              style={[
                styles.pillText,
                { color: selectedBusId === null ? '#000000' : colors.textPrimary },
              ]}
            >
              None (Unassigned)
            </Text>
          </TouchableOpacity>
          {activeBuses.map((b) => {
            const isSelected = selectedBusId === b.id;
            return (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected
                      ? '#00D488'
                      : isLight
                      ? '#f1f5f9'
                      : 'rgba(255,255,255,0.08)',
                  },
                ]}
                onPress={() => setSelectedBusId(b.id)}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isSelected ? '#000000' : colors.textPrimary },
                  ]}
                >
                  🚌 {b.registrationNumber || b.model}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  formScroll: {
    maxHeight: 460,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  roleCard: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  roleIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  roleDesc: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
