/**
 * Add Stoppage / Geo-fence Modal
 * Creates transit stoppage with precise geographic coordinates and code.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal, Button, TextInput } from '../../../components/common';
import { useOperatorStore } from '../../../stores/operator.store';

export const AddStopModal: React.FC = () => {
  const { isAddStopModalOpen, setIsAddStopModalOpen, createStop } = useOperatorStore();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [landmark, setLandmark] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setCode('');
    setLatitude('');
    setLongitude('');
    setLandmark('');
    setFormError(null);
  };

  useEffect(() => {
    if (isAddStopModalOpen) {
      resetForm();
    }
  }, [isAddStopModalOpen]);

  const handleCreate = async () => {
    setFormError(null);

    if (name.trim().length < 2) {
      setFormError('Stop name must be at least 2 characters');
      return;
    }

    if (code.trim().length < 2) {
      setFormError('Stop code must be at least 2 characters (e.g. BBS, CTC)');
      return;
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setFormError('Valid latitude between -90 and 90 is required');
      return;
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      setFormError('Valid longitude between -180 and 180 is required');
      return;
    }

    const success = await createStop({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      location: { latitude: lat, longitude: lon },
      landmark: landmark.trim() || undefined,
    });

    if (success) {
      resetForm();
      setIsAddStopModalOpen(false);
    }
  };

  return (
    <Modal
      isOpen={isAddStopModalOpen}
      onClose={() => setIsAddStopModalOpen(false)}
      title="Create Transit Stoppage"
      subtitle="Define geo-fenced passenger boarding and deboarding location"
      icon="📍"
      actions={
        <>
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            onPress={() => setIsAddStopModalOpen(false)}
          />
          <Button
            title="Create Stoppage"
            variant="primary"
            size="md"
            onPress={handleCreate}
          />
        </>
      }
    >
      <View style={styles.container}>
        {formError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {formError}</Text>
          </View>
        )}

        <TextInput
          label="STOPPAGE NAME *"
          placeholder="e.g. Baramunda Bus Terminal"
          value={name}
          onChangeText={setName}
          autoComplete="off"
          style={styles.field}
        />

        <TextInput
          label="STOP CODE (2-20 CHARACTERS) *"
          placeholder="e.g. BRM"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoComplete="off"
          style={styles.field}
        />

        <View style={styles.coordsRow}>
          <View style={{ flex: 1 }}>
            <TextInput
              label="LATITUDE (-90 to 90) *"
              placeholder="e.g. 20.2961"
              value={latitude}
              onChangeText={setLatitude}
              keyboardType="numeric"
              autoComplete="off"
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              label="LONGITUDE (-180 to 180) *"
              placeholder="e.g. 85.8245"
              value={longitude}
              onChangeText={setLongitude}
              keyboardType="numeric"
              autoComplete="off"
            />
          </View>
        </View>

        <TextInput
          label="LANDMARK (OPTIONAL)"
          placeholder="e.g. Near Overbridge"
          value={landmark}
          onChangeText={setLandmark}
          autoComplete="off"
          style={{ ...styles.field, marginTop: 12 }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
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
  coordsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
