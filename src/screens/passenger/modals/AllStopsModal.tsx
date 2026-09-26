import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../theme';
import { Modal, Button, Badge } from '../../../components/common';
import { TransitStop } from '../../../types';
import { passengerService } from '../../../services/passenger.service';
import { usePassengerStore } from '../../../stores/passenger.store';

interface AllStopsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStop?: (stop: TransitStop, type: 'FROM' | 'TO') => void;
}

export const AllStopsModal: React.FC<AllStopsModalProps> = ({
  isOpen,
  onClose,
  onSelectStop,
}) => {
  const { colors, isLight } = useTheme();
  const { setOrigin, setDestination } = usePassengerStore();
  const [stops, setStops] = useState<TransitStop[]>([]);

  useEffect(() => {
    if (isOpen) {
      passengerService.getNearbyStops().then(setStops);
    }
  }, [isOpen]);

  const handleSelectFrom = (stop: TransitStop) => {
    setOrigin(stop.name);
    if (onSelectStop) onSelectStop(stop, 'FROM');
    onClose();
  };

  const handleSelectTo = (stop: TransitStop) => {
    setDestination(stop.name);
    if (onSelectStop) onSelectStop(stop, 'TO');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Active Transit Stoppages"
      subtitle="Rural Highway Corridor Network"
      icon="🚏"
      maxWidth={520}
    >
      <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
        {stops.map((stop) => (
          <View
            key={stop.id}
            style={[
              styles.stopCard,
              {
                backgroundColor: isLight ? '#ffffff' : '#1e293b',
                borderColor: isLight ? '#e2e8f0' : '#334155',
              },
            ]}
          >
            <View style={styles.stopInfo}>
              <Text style={[styles.stopName, { color: colors.textPrimary }]}>
                {stop.name}
              </Text>
              <Text style={[styles.stopMeta, { color: colors.textMuted }]}>
                Code: {stop.code} · Distance: {stop.highwayMarkerKm} km
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => handleSelectFrom(stop)}
                style={[
                  styles.pillButton,
                  {
                    backgroundColor: '#ecfdf5',
                    borderColor: '#a7f3d0',
                  },
                ]}
              >
                <Text style={[styles.pillText, { color: '#047857' }]}>From</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSelectTo(stop)}
                style={[
                  styles.pillButton,
                  {
                    backgroundColor: '#eff6ff',
                    borderColor: '#bfdbfe',
                  },
                ]}
              >
                <Text style={[styles.pillText, { color: '#1d4ed8' }]}>To</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrollList: {
    maxHeight: 440,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  stopInfo: {
    flex: 1,
    marginRight: 8,
  },
  stopName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  stopMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  pillButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
