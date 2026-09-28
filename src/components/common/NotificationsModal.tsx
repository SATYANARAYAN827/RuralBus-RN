/**
 * Notifications Modal Component
 * Renders in-app notifications tailored to the current authenticated user's credentials and tenant.
 * - Platform Admin: Sees operator registration requests, bus permit submissions, and audit alerts.
 * - Operator Admin: Sees strictly scoped bus approval messages, staff additions, and tenant notices.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Modal, Button, Badge } from './index';
import { useTheme } from '../../theme';
import { useNotificationStore, AppNotification } from '../../stores/notification.store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  tenantId?: string | null;
  userPhone?: string | null;
  onNavigateToRequests?: () => void;
  onNavigateToBuses?: () => void;
}

export const NotificationsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userRole,
  tenantId,
  userPhone,
  onNavigateToRequests,
  onNavigateToBuses,
}) => {
  const { colors, isLight } = useTheme();
  const {
    getNotificationsForUser,
    markAsRead,
    markAllAsReadForUser,
  } = useNotificationStore();

  const notifications = getNotificationsForUser(userRole, tenantId, userPhone);

  const getIcon = (type: string) => {
    switch (type) {
      case 'BUS_APPROVAL_REQUEST':
        return '📥';
      case 'BUS_APPROVED':
        return '🎉';
      case 'BUS_REJECTED':
        return '⚠️';
      case 'STAFF_ADDED':
        return '👥';
      default:
        return '🔔';
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const hours = d.getHours();
      const mins = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      return `${formattedHours}:${mins} ${ampm}`;
    } catch {
      return 'Today';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={userRole === 'PLATFORM_ADMIN' ? 'Platform Audit & Requests' : 'Operator Notifications'}
      subtitle={
        userRole === 'PLATFORM_ADMIN'
          ? 'Live feed of operator bus requests and system activity'
          : 'Tenant updates, bus approvals, and operational alerts'
      }
      icon="🔔"
      actions={
        <View style={styles.actionRow}>
          {notifications.length > 0 && (
            <Button
              title="Mark all as read"
              variant="outline"
              size="sm"
              onPress={() => markAllAsReadForUser(userRole, tenantId, userPhone)}
            />
          )}
          <View style={{ flex: 1 }} />
          <Button title="Close" variant="primary" size="md" onPress={onClose} />
        </View>
      }
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No Notifications Yet
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              You have no new alerts or activity updates for your account.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: item.read
                      ? isLight
                        ? '#f8fafc'
                        : 'rgba(255, 255, 255, 0.03)'
                      : isLight
                      ? '#ecfdf5'
                      : 'rgba(0, 212, 136, 0.10)',
                    borderColor: item.read
                      ? isLight
                        ? '#e2e8f0'
                        : 'rgba(255, 255, 255, 0.06)'
                      : '#00D488',
                  },
                ]}
                onPress={() => {
                  markAsRead(item.id);
                  if (item.type === 'BUS_APPROVAL_REQUEST' && onNavigateToRequests) {
                    onClose();
                    onNavigateToRequests();
                  } else if (item.type === 'BUS_APPROVED' && onNavigateToBuses) {
                    onClose();
                    onNavigateToBuses();
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={styles.itemHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Text style={{ fontSize: 18 }}>{getIcon(item.type)}</Text>
                    <Text
                      style={[
                        styles.itemTitle,
                        { color: colors.textPrimary, fontWeight: item.read ? '700' : '900' },
                      ]}
                    >
                      {item.title}
                    </Text>
                  </View>
                  <Text style={[styles.timeText, { color: colors.textMuted }]}>
                    {formatTime(item.createdAt)}
                  </Text>
                </View>

                <Text style={[styles.itemMessage, { color: colors.textSecondary }]}>
                  {item.message}
                </Text>

                {item.type === 'BUS_APPROVAL_REQUEST' && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.actionPromptText}>Click to review in Requests menu ➔</Text>
                  </View>
                )}

                {item.type === 'BUS_APPROVED' && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.actionPromptText}>Click to view in Fleet Buses ➔</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 460,
  },
  list: {
    gap: 10,
    paddingVertical: 4,
  },
  itemCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 13,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemMessage: {
    fontSize: 12,
    lineHeight: 16,
    paddingLeft: 26,
  },
  actionPromptText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D488',
    paddingLeft: 26,
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
});
