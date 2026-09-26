import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal, Button } from '../../../components/common';
import { useSuperAdminStore } from '../../../stores/superadmin.store';

interface Props {
  isOpen: boolean;
  staffId: string;
  staffName: string;
  onClose: () => void;
}

export const DeleteStaffConfirmModal: React.FC<Props> = ({
  isOpen, staffId, staffName, onClose,
}) => {
  const { deleteStaff, isLoadingStaff, staffError } = useSuperAdminStore();

  const handleConfirm = async () => {
    const ok = await deleteStaff(staffId);
    if (ok) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Remove Staff Member"
      subtitle="This action is irreversible"
      icon="??"
      actions={
        <>
          <Button title="Cancel" variant="outline" size="md" onPress={onClose} />
          <Button
            title={isLoadingStaff ? 'Removing...' : 'Remove Staff'}
            variant="danger"
            size="md"
            onPress={handleConfirm}
            isLoading={isLoadingStaff}
          />
        </>
      }
    >
      <Text style={styles.message}>
        Are you sure you want to permanently remove{' '}
        <Text style={styles.name}>{staffName}</Text> from the platform?{'\n\n'}
        This will revoke their login access and remove their assignment.
      </Text>
      {staffError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>?? {staffError}</Text>
        </View>
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  message: { fontSize: 14, color: '#cbd5e1', lineHeight: 22 },
  name: { fontWeight: '900', color: '#fca5a5' },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 10, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#ef4444' },
  errorText: { color: '#fca5a5', fontSize: 13, fontWeight: '600' },
});
