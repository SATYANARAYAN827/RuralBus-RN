/**
 * Add Fleet Bus Modal
 * Validates registration, model, seating capacity, seating layout, and amenities.
 * Authoritative note: Bus status defaults to PENDING_APPROVAL for Operator Admin.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Modal, Button, TextInput } from '../../../components/common';
import { useTheme } from '../../../theme';
import { useOperatorStore } from '../../../stores/operator.store';
import { BusSeatingType } from '../../../types/operator.types';

export const AddBusModal: React.FC = () => {
  const { colors, isLight } = useTheme();
  const { isAddBusModalOpen, setIsAddBusModalOpen, registerBus, isLoadingBuses } = useOperatorStore();

  const [regNumber, setRegNumber] = useState('');
  const [model, setModel] = useState('');
  const [totalSeats, setTotalSeats] = useState('40');
  const [seatingType, setSeatingType] = useState<BusSeatingType>('SEATER_2X2');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['AC', 'CCTV']);
  const [formError, setFormError] = useState<string | null>(null);

  const availableAmenities = ['AC', 'WiFi', 'CCTV', 'USB Charging', 'Water Bottle', 'First Aid'];

  const toggleAmenity = (item: string) => {
    if (selectedAmenities.includes(item)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== item));
    } else {
      setSelectedAmenities([...selectedAmenities, item]);
    }
  };

  const handleRegister = async () => {
    setFormError(null);
    if (!model.trim()) {
      setFormError('Bus model is required (e.g. Tata Marcopolo, Ashok Leyland)');
      return;
    }

    const seats = parseInt(totalSeats, 10);
    if (isNaN(seats) || seats < 10 || seats > 80) {
      setFormError('Total seats must be a number between 10 and 80');
      return;
    }

    if (regNumber.trim() && !/^[A-Z0-9\s\-]+$/i.test(regNumber.trim())) {
      setFormError('Registration number must contain only uppercase letters, digits, hyphens, and spaces');
      return;
    }

    const success = await registerBus({
      registrationNumber: regNumber.trim().toUpperCase() || undefined,
      model: model.trim(),
      totalSeats: seats,
      seatingType,
      amenities: selectedAmenities,
    });

    if (success) {
      setRegNumber('');
      setModel('');
      setTotalSeats('40');
      setIsAddBusModalOpen(false);
    }
  };

  return (
    <Modal
      isOpen={isAddBusModalOpen}
      onClose={() => setIsAddBusModalOpen(false)}
      title="Register New Fleet Bus"
      subtitle="Submit bus for fleet operation and platform verification"
      icon="🚌"
      actions={
        <>
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            onPress={() => setIsAddBusModalOpen(false)}
          />
          <Button
            title={isLoadingBuses ? 'Registering...' : 'Register Bus'}
            variant="primary"
            size="md"
            isLoading={isLoadingBuses}
            onPress={handleRegister}
          />
        </>
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>ℹ️ Authoritative Approval State</Text>
          <Text style={styles.noticeText}>
            Buses registered by Operator Admin are created with status PENDING_APPROVAL.
            Platform Super Admin reviews and activates vehicles before dispatch.
          </Text>
        </View>

        {formError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {formError}</Text>
          </View>
        )}

        <TextInput
          label="REGISTRATION NUMBER"
          placeholder="e.g. OD-02-AX-1029"
          value={regNumber}
          onChangeText={setRegNumber}
          autoCapitalize="characters"
          style={styles.field}
        />

        <TextInput
          label="BUS MODEL / MAKE *"
          placeholder="e.g. BharatBenz 1017 AC Coach"
          value={model}
          onChangeText={setModel}
          style={styles.field}
        />

        <TextInput
          label="TOTAL SEATING CAPACITY (10 - 80) *"
          placeholder="40"
          value={totalSeats}
          onChangeText={setTotalSeats}
          keyboardType="numeric"
          style={styles.field}
        />

        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>SEATING LAYOUT</Text>
        <View style={styles.pillRow}>
          {(['SEATER_2X2', 'SEATER_3X2', 'SLEEPER', 'SEMI_SLEEPER'] as BusSeatingType[]).map((layout) => {
            const isSelected = seatingType === layout;
            return (
              <TouchableOpacity
                key={layout}
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
                onPress={() => setSeatingType(layout)}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isSelected ? '#000000' : colors.textPrimary },
                  ]}
                >
                  {layout.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 14 }]}>
          AMENITIES
        </Text>
        <View style={styles.pillRow}>
          {availableAmenities.map((amenity) => {
            const isSelected = selectedAmenities.includes(amenity);
            return (
              <TouchableOpacity
                key={amenity}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(0, 212, 136, 0.2)'
                      : isLight
                      ? '#f1f5f9'
                      : 'rgba(255,255,255,0.08)',
                    borderColor: isSelected ? '#00D488' : 'transparent',
                    borderWidth: 1,
                  },
                ]}
                onPress={() => toggleAmenity(amenity)}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isSelected ? '#00D488' : colors.textPrimary },
                  ]}
                >
                  {isSelected ? `✓ ${amenity}` : `+ ${amenity}`}
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
  noticeBox: {
    backgroundColor: 'rgba(0, 212, 136, 0.08)',
    borderColor: 'rgba(0, 212, 136, 0.25)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00D488',
    marginBottom: 2,
  },
  noticeText: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
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
