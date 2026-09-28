import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal, Button, TextInput } from '../../../components/common';
import { useTheme } from '../../../theme';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bus: {
    id: string;
    reg: string;
    model: string;
    seats: number;
    status: string;
    operator: string;
  };
  onSave?: (updated: { model: string; seats: number; status: string }) => void;
}

export const EditBusModal: React.FC<Props> = ({ isOpen, onClose, bus, onSave }) => {
  const { colors } = useTheme();
  const [model, setModel] = useState(bus.model);
  const [seats, setSeats] = useState(String(bus.seats));
  const [status, setStatus] = useState(bus.status);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setModel(bus.model);
    setSeats(String(bus.seats));
    setStatus(bus.status);
    setError(null);
  }, [bus]);

  const handleSave = () => {
    if (!model.trim()) {
      setError('Bus model is required.');
      return;
    }
    const numSeats = parseInt(seats, 10);
    if (isNaN(numSeats) || numSeats < 1) {
      setError('Valid passenger seat count is required.');
      return;
    }

    if (onSave) {
      onSave({ model: model.trim(), seats: numSeats, status });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Bus Details"
      subtitle={`${bus.reg} • ${bus.operator}`}
      icon="🚌"
      actions={
        <>
          <Button title="Cancel" variant="outline" size="md" onPress={onClose} />
          <Button title="Save Changes" variant="primary" size="md" onPress={handleSave} />
        </>
      }
    >
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      <View style={{ marginBottom: 12 }}>
        <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>REGISTRATION NUMBER</Text>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 12 }}>
          <Text style={{ color: '#00D488', fontWeight: '800', fontSize: 14 }}>{bus.reg}</Text>
        </View>
      </View>
      <TextInput
        label="BUS MODEL *"
        value={model}
        onChangeText={setModel}
        placeholder="e.g. Tata Starbus Ultra"
      />
      <TextInput
        label="PASSENGER SEATS *"
        value={seats}
        onChangeText={setSeats}
        keyboardType="number-pad"
        placeholder="e.g. 32"
      />

      <View style={styles.statusSection}>
        <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
          OPERATIONAL STATUS
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            title="ACTIVE"
            variant={status === 'ACTIVE' ? 'mint' : 'outline'}
            size="sm"
            onPress={() => setStatus('ACTIVE')}
          />
          <Button
            title="MAINTENANCE"
            variant={status === 'MAINTENANCE' ? 'danger' : 'outline'}
            size="sm"
            onPress={() => setStatus('MAINTENANCE')}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorText: { color: '#fca5a5', fontSize: 13, fontWeight: '600' },
  statusSection: { marginTop: 10, marginBottom: 14 },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
});
