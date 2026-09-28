/**
 * Authoritative Notification & Approval Requests State Store
 *
 * Requirements:
 * - When owner requests to add a bus, an approval request is dispatched to Super Admin.
 * - When Super Admin approves/rejects, a message is routed strictly on a credential/tenant basis.
 * - Only the operator who submitted the bus receives their vehicle approval notification.
 * - Supports one-time popup modals for pending approval and approval confirmation.
 * - Web persistent via localStorage (safe fallback in memory).
 */

import { create } from 'zustand';

export type NotificationType =
  | 'BUS_APPROVAL_REQUEST'
  | 'BUS_APPROVED'
  | 'BUS_REJECTED'
  | 'STAFF_ADDED'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  targetRole?: 'PLATFORM_ADMIN' | 'OPERATOR_ADMIN';
  targetTenantId?: string; // Strictly scoped to operator tenant!
  targetPhone?: string;    // Scoped to specific owner phone
  busId?: string;
  busReg?: string;
  busModel?: string;
  operatorName?: string;
  ownerName?: string;
  createdAt: string;
  read: boolean;
  popupShown?: boolean;
}

const STORAGE_KEY = 'ruralbus_notifications_v1';

const getInitialNotifications = (): AppNotification[] => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
  }

  // Initial seed: represents the existing request for TE-ST-2026
  return [
    {
      id: 'notif-seed-test-bus',
      type: 'BUS_APPROVAL_REQUEST',
      title: 'New Bus Registration Request',
      message: 'Operator "New Company" submitted bus TE-ST-2026 (Testing Bus, 30 seats) for platform verification.',
      targetRole: 'PLATFORM_ADMIN',
      targetTenantId: 'new-company-tenant-id',
      targetPhone: '9876543999',
      busId: '2248e6e7-8adf-4421-bda9-00f093f1aa49',
      busReg: 'TE-ST-2026',
      busModel: 'Testing Bus',
      operatorName: 'New Company',
      ownerName: 'Test Owner',
      createdAt: new Date().toISOString(),
      read: false,
      popupShown: true,
    },
  ];
};

const persistNotifications = (notifications: AppNotification[]) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {}
  }
};

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (
    data: Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'popupShown'>
  ) => AppNotification;
  markAsRead: (id: string) => void;
  markAllAsReadForUser: (role?: string, tenantId?: string | null, phone?: string | null) => void;
  markPopupShown: (id: string) => void;
  getNotificationsForUser: (
    role?: string,
    tenantId?: string | null,
    phone?: string | null
  ) => AppNotification[];
  getUnreadCountForUser: (
    role?: string,
    tenantId?: string | null,
    phone?: string | null
  ) => number;
  getPendingPopupsForUser: (
    role?: string,
    tenantId?: string | null,
    phone?: string | null
  ) => AppNotification[];
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: getInitialNotifications(),

  addNotification: (data) => {
    const newNotif: AppNotification = {
      ...data,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      read: false,
      popupShown: false,
    };

    set((state) => {
      const updated = [newNotif, ...state.notifications];
      persistNotifications(updated);
      return { notifications: updated };
    });

    return newNotif;
  },

  markAsRead: (id: string) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      persistNotifications(updated);
      return { notifications: updated };
    });
  },

  markAllAsReadForUser: (role, tenantId, phone) => {
    set((state) => {
      const updated = state.notifications.map((n) => {
        let isForUser = false;
        if (role === 'PLATFORM_ADMIN') {
          isForUser = n.targetRole === 'PLATFORM_ADMIN' || !n.targetRole;
        } else if (role === 'OPERATOR_ADMIN') {
          isForUser =
            Boolean(tenantId && n.targetTenantId === tenantId) ||
            Boolean(phone && n.targetPhone === phone);
        }
        return isForUser ? { ...n, read: true } : n;
      });
      persistNotifications(updated);
      return { notifications: updated };
    });
  },

  markPopupShown: (id: string) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, popupShown: true, read: true } : n
      );
      persistNotifications(updated);
      return { notifications: updated };
    });
  },

  getNotificationsForUser: (role, tenantId, phone) => {
    const { notifications } = get();
    if (role === 'PLATFORM_ADMIN') {
      return notifications.filter(
        (n) => n.targetRole === 'PLATFORM_ADMIN' || !n.targetRole
      );
    }
    if (role === 'OPERATOR_ADMIN') {
      return notifications.filter((n) => {
        if (tenantId && n.targetTenantId === tenantId) return true;
        if (phone && n.targetPhone === phone) return true;
        return false;
      });
    }
    return [];
  },

  getUnreadCountForUser: (role, tenantId, phone) => {
    return get().getNotificationsForUser(role, tenantId, phone).filter((n) => !n.read).length;
  },

  getPendingPopupsForUser: (role, tenantId, phone) => {
    return get()
      .getNotificationsForUser(role, tenantId, phone)
      .filter((n) => !n.popupShown && (n.type === 'BUS_APPROVED' || n.type === 'BUS_REJECTED'));
  },
}));
