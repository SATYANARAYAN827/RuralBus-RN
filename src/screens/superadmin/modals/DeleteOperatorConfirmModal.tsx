import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal, Button } from '../../../components/common';
import { useSuperAdminStore } from '../../../stores/superadmin.store';

interface Props {
  isOpen: boolean;
  tenantId: string;
  operatorName: string;
  onClose: () => void;
}

export const DeleteOperatorConfirmModal: React.FC<Props> = ({
  isOpen, tenantId, operatorName, onClose,
}) => {
  const { deleteOperator, isLoadingOperators, operatorError } = useSuperAdminStore();

  const handleConfirm = async () => {
    const ok = await deleteOperator(tenantId);
    if (ok) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Operator"
      subtitle="This action is irreversible"
      icon="??"
      actions={
        <>
          <Button title="Cancel" variant="outline" size="md" onPress={onClose} />
          <Button
            title={isLoadingOperators ? 'Deleting...' : 'Delete Permanently'}
            variant="danger"
            size="md"
            onPress={handleConfirm}
            isLoading={isLoadingOperators}
          />
        </>
      }
    >
      <Text style={styles.message}>
        Are you sure you want to permanently delete operator{' '}
        <Text style={styles.name}>{operatorName}</Text>?{'\n\n'}
        This will remove the operator, their owner account, all associated staff members, and fleet buses from the platform.
      </Text>
      {operatorError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>?? {operatorError}</Text>
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
