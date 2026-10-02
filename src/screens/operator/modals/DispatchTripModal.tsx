/**
 * Dispatch Trip Modal
 * Enables Operator Admin to schedule and dispatch daily transit trips.
 * Selects route corridor, assigned bus, driver, and conductor.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Modal, Button, TextInput } from '../../../components/common';
import { useTheme } from '../../../theme';
import { useOperatorStore } from '../../../stores/operator.store';

export const DispatchTripModal: React.FC = () => {
  const { colors, isLight } = useTheme();
  const {
    isDispatchTripModalOpen,
    setIsDispatchTripModalOpen,
    dispatchTrip,
    routes,
    fetchRoutes,
    buses,
    fetchBuses,
    staff,
    fetchStaff,
    isLoadingTrips,
  } = useOperatorStore();

  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedConductorId, setSelectedConductorId] = useState<string>('');
  const [departureTime, setDepartureTime] = useState('');
  const [scheduledArrival, setScheduledArrival] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setSelectedRouteId('');
    setSelectedBusId('');
    setSelectedDriverId('');
    setSelectedConductorId('');
    setDepartureTime('');
    setScheduledArrival('');
    setFormError(null);
  };

  useEffect(() => {
    if (isDispatchTripModalOpen) {
      resetForm();
      if (routes.length === 0) fetchRoutes();
      if (buses.length === 0) fetchBuses();
      if (staff.length === 0) fetchStaff();
    }
  }, [isDispatchTripModalOpen, routes.length, buses.length, staff.length, fetchRoutes, fetchBuses, fetchStaff]);

  const activeBuses = buses.filter((b) => b.status === 'ACTIVE');
  const drivers = staff.filter((s) => s.role === 'DRIVER' && s.isActive);
  const conductors = staff.filter((s) => s.role === 'CONDUCTOR' && s.isActive);

  const handleDispatch = async () => {
    setFormError(null);

    if (!selectedRouteId) {
      setFormError('Please select a route corridor');
      return;
    }

    if (!selectedBusId) {
      setFormError('Please select an active bus');
      return;
    }

    if (!departureTime || !scheduledArrival) {
      setFormError('Departure and arrival timestamps are required');
      return;
    }

    const depDate = new Date(departureTime);
    const arrDate = new Date(scheduledArrival);

    if (isNaN(depDate.getTime()) || isNaN(arrDate.getTime())) {
      setFormError('Please enter valid date/time strings (YYYY-MM-DDTHH:mm)');
      return;
    }

    if (arrDate <= depDate) {
      setFormError('Scheduled arrival must be after departure time');
      return;
    }

    const success = await dispatchTrip({
      routeId: selectedRouteId,
      busId: selectedBusId,
      driverId: selectedDriverId || undefined,
      conductorId: selectedConductorId || undefined,
      departureTime: depDate.toISOString(),
      scheduledArrival: arrDate.toISOString(),
    });

    if (success) {
      setIsDispatchTripModalOpen(false);
      setSelectedRouteId('');
      setSelectedBusId('');
      setSelectedDriverId('');
      setSelectedConductorId('');
    }
  };

  return (
    <Modal
      isOpen={isDispatchTripModalOpen}
      onClose={() => setIsDispatchTripModalOpen(false)}
      title="Dispatch Trip"
      subtitle="Schedule departure, vehicle, and crew assignment"
      icon="⏱️"
      actions={
        <>
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            onPress={() => setIsDispatchTripModalOpen(false)}
          />
          <Button
            title={isLoadingTrips ? 'Dispatching...' : 'Dispatch Trip'}
            variant="primary"
            size="md"
            isLoading={isLoadingTrips}
            onPress={handleDispatch}
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

        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>SELECT ROUTE CORRIDOR *</Text>
        <View style={styles.pillRow}>
          {routes.map((r) => {
            const isSelected = selectedRouteId === r.id;
            return (
              <TouchableOpacity
                key={r.id}
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
                onPress={() => setSelectedRouteId(r.id)}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isSelected ? '#000000' : colors.textPrimary },
                  ]}
                >
                  🛣️ {r.routeCode}: {r.origin} ➔ {r.destination}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 14 }]}>
          ASSIGN ACTIVE FLEET BUS *
        </Text>
        <View style={styles.pillRow}>
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
                  🚌 {b.registrationNumber || b.model} ({b.totalSeats} seats)
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 14 }]}>
          ASSIGN DRIVER (OPTIONAL)
        </Text>
        <View style={styles.pillRow}>
          <TouchableOpacity
            style={[
              styles.pill,
              {
                backgroundColor: !selectedDriverId
                  ? '#00D488'
                  : isLight
                  ? '#f1f5f9'
                  : 'rgba(255,255,255,0.08)',
              },
            ]}
            onPress={() => setSelectedDriverId('')}
          >
            <Text
              style={[
                styles.pillText,
                { color: !selectedDriverId ? '#000000' : colors.textPrimary },
              ]}
            >
              None
            </Text>
          </TouchableOpacity>
          {drivers.map((d) => {
            const isSelected = selectedDriverId === d.userId;
            return (
              <TouchableOpacity
                key={d.userId}
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
                onPress={() => setSelectedDriverId(d.userId)}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isSelected ? '#000000' : colors.textPrimary },
                  ]}
                >
                  👨‍✈️ {d.fullName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 14 }]}>
          ASSIGN CONDUCTOR (OPTIONAL)
        </Text>
        <View style={styles.pillRow}>
          <TouchableOpacity
            style={[
              styles.pill,
              {
                backgroundColor: !selectedConductorId
                  ? '#00D488'
                  : isLight
                  ? '#f1f5f9'
                  : 'rgba(255,255,255,0.08)',
              },
            ]}
            onPress={() => setSelectedConductorId('')}
          >
            <Text
              style={[
                styles.pillText,
                { color: !selectedConductorId ? '#000000' : colors.textPrimary },
              ]}
            >
              None
            </Text>
          </TouchableOpacity>
          {conductors.map((c) => {
            const isSelected = selectedConductorId === c.userId;
            return (
              <TouchableOpacity
                key={c.userId}
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
                onPress={() => setSelectedConductorId(c.userId)}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isSelected ? '#000000' : colors.textPrimary },
                  ]}
                >
                  🎫 {c.fullName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          label="DEPARTURE TIME (YYYY-MM-DDTHH:mm) *"
          placeholder="e.g. 2026-09-26T18:00"
          value={departureTime}
          onChangeText={setDepartureTime}
          autoComplete="off"
          style={{ ...styles.field, marginTop: 14 }}
        />

        <TextInput
          label="SCHEDULED ARRIVAL (YYYY-MM-DDTHH:mm) *"
          placeholder="e.g. 2026-09-26T21:00"
          value={scheduledArrival}
          onChangeText={setScheduledArrival}
          autoComplete="off"
          style={styles.field}
        />
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
