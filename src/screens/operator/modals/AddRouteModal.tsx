/**
 * Add Route Modal
 * Creates transit corridor with ordered stoppages, cumulative distances, and fares.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Modal, Button, TextInput } from '../../../components/common';
import { useTheme } from '../../../theme';
import { useOperatorStore } from '../../../stores/operator.store';

export const AddRouteModal: React.FC = () => {
  const { colors, isLight } = useTheme();
  const {
    isAddRouteModalOpen,
    setIsAddRouteModalOpen,
    createRoute,
    stops,
    fetchStops,
    setIsAddStopModalOpen,
    isLoadingRoutes,
  } = useOperatorStore();

  const [routeCode, setRouteCode] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originStopId, setOriginStopId] = useState('');
  const [destStopId, setDestStopId] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [fare, setFare] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setRouteCode('');
    setOrigin('');
    setDestination('');
    setOriginStopId('');
    setDestStopId('');
    setDistanceKm('');
    setDurationMinutes('');
    setFare('');
    setFormError(null);
  };

  useEffect(() => {
    if (isAddRouteModalOpen) {
      resetForm();
      if (stops.length === 0) {
        fetchStops();
      }
    }
  }, [isAddRouteModalOpen, stops.length, fetchStops]);

  useEffect(() => {
    if (stops.length >= 2 && !originStopId && !destStopId) {
      setOriginStopId(stops[0].id);
      setDestStopId(stops[1].id);
      setOrigin(stops[0].name);
      setDestination(stops[1].name);
    }
  }, [stops, originStopId, destStopId]);

  const handleCreate = async () => {
    setFormError(null);

    if (!routeCode.trim()) {
      setFormError('Route code is required (e.g. OD-01, CTC-PURI)');
      return;
    }

    if (!origin.trim() || !destination.trim()) {
      setFormError('Origin and destination descriptions are required');
      return;
    }

    if (!originStopId || !destStopId || originStopId === destStopId) {
      setFormError('Route must have at least 2 distinct stops (origin and destination)');
      return;
    }

    const dist = parseFloat(distanceKm);
    const dur = parseInt(durationMinutes, 10);
    const fareAmt = parseFloat(fare);

    if (isNaN(dist) || dist <= 0) {
      setFormError('Total distance must be positive number');
      return;
    }

    if (isNaN(dur) || dur <= 0) {
      setFormError('Duration must be positive minutes');
      return;
    }

    if (isNaN(fareAmt) || fareAmt <= 0) {
      setFormError('Fare amount must be positive');
      return;
    }

    const success = await createRoute({
      routeCode: routeCode.trim().toUpperCase(),
      origin: origin.trim(),
      destination: destination.trim(),
      stops: [
        {
          stopId: originStopId,
          sequenceNumber: 1,
          distanceFromStartKm: 0,
          estimatedMinutesFromStart: 0,
          fareFromStart: 0,
        },
        {
          stopId: destStopId,
          sequenceNumber: 2,
          distanceFromStartKm: dist,
          estimatedMinutesFromStart: dur,
          fareFromStart: fareAmt,
        },
      ],
    });

    if (success) {
      resetForm();
      setIsAddRouteModalOpen(false);
    }
  };

  return (
    <Modal
      isOpen={isAddRouteModalOpen}
      onClose={() => setIsAddRouteModalOpen(false)}
      title="Create Route Corridor"
      subtitle="Define route code, origin, destination, and ordered stop sequence"
      icon="🛣️"
      actions={
        <>
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            onPress={() => setIsAddRouteModalOpen(false)}
          />
          <Button
            title={isLoadingRoutes ? 'Creating...' : 'Create Route'}
            variant="primary"
            size="md"
            isLoading={isLoadingRoutes}
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

        <TextInput
          label="ROUTE CODE *"
          placeholder="e.g. OD-01"
          value={routeCode}
          onChangeText={setRouteCode}
          autoCapitalize="characters"
          autoComplete="off"
          style={styles.field}
        />

        <TextInput
          label="ORIGIN CITY / REGION *"
          placeholder="e.g. Bhubaneswar"
          value={origin}
          onChangeText={setOrigin}
          autoComplete="off"
          style={styles.field}
        />

        <TextInput
          label="DESTINATION CITY / REGION *"
          placeholder="e.g. Puri"
          value={destination}
          onChangeText={setDestination}
          autoComplete="off"
          style={styles.field}
        />

        <View style={styles.stopsHeader}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            ORDERED STOPPAGE SEQUENCE (MIN 2)
          </Text>
          <TouchableOpacity
            onPress={() => {
              setIsAddRouteModalOpen(false);
              setIsAddStopModalOpen(true);
            }}
          >
            <Text style={styles.addStopLink}>+ New Stop</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.subLabel, { color: '#94a3b8' }]}>1. ORIGIN STOP *</Text>
        <View style={styles.pillRow}>
          {stops.map((s) => {
            const isSelected = originStopId === s.id;
            return (
              <TouchableOpacity
                key={s.id}
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
                onPress={() => {
                  setOriginStopId(s.id);
                  if (!origin) setOrigin(s.name);
                }}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isSelected ? '#000000' : colors.textPrimary },
                  ]}
                >
                  📍 {s.name} ({s.code})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.subLabel, { color: '#94a3b8', marginTop: 12 }]}>
          2. DESTINATION STOP *
        </Text>
        <View style={styles.pillRow}>
          {stops.map((s) => {
            const isSelected = destStopId === s.id;
            return (
              <TouchableOpacity
                key={s.id}
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
                onPress={() => {
                  setDestStopId(s.id);
                  if (!destination) setDestination(s.name);
                }}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isSelected ? '#000000' : colors.textPrimary },
                  ]}
                >
                  🏁 {s.name} ({s.code})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.metricsRow}>
          <View style={{ flex: 1 }}>
            <TextInput
              label="DISTANCE (KM) *"
              placeholder="e.g. 60"
              value={distanceKm}
              onChangeText={setDistanceKm}
              keyboardType="numeric"
              autoComplete="off"
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              label="DURATION (MIN) *"
              placeholder="e.g. 90"
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              keyboardType="numeric"
              autoComplete="off"
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              label="FARE (₹) *"
              placeholder="e.g. 80"
              value={fare}
              onChangeText={setFare}
              keyboardType="numeric"
              autoComplete="off"
            />
          </View>
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
  stopsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  addStopLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D488',
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
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
});
