import { create } from 'zustand';
import { UserRole, UserProfile } from '../types';

interface NavigationState {
  activeRole: UserRole;
  activeTab: string;
  isMobileNavOpen: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
  unreadNotifsCount: number;

  setActiveRole: (role: UserRole) => void;
  setActiveTab: (tab: string) => void;
  toggleMobileNav: () => void;
  setMobileNavOpen: (open: boolean) => void;
  login: (role?: UserRole) => void;
  logout: () => void;
}

const getMockUser = (role: UserRole): UserProfile => {
  switch (role) {
    case 'DRIVER':
      return {
        id: 'usr-driver-1',
        phone: '9876543202',
        fullName: 'Bishnu Charan Sahoo',
        role: 'DRIVER',
        tenantId: 'demo-travel-tenant',
        isActive: true,
        mustChangePassword: false,
        phoneVerified: true,
      };
    case 'CONDUCTOR':
      return {
        id: 'usr-conductor-1',
        phone: '9876543203',
        fullName: 'Demo Conductor',
        role: 'CONDUCTOR',
        tenantId: 'demo-travel-tenant',
        isActive: true,
        mustChangePassword: false,
        phoneVerified: true,
      };
    case 'OPERATOR_ADMIN':
      return {
        id: 'usr-operator-1',
        phone: '9861465410',
        fullName: 'Satya Demo Operator',
        role: 'OPERATOR_ADMIN',
        tenantId: 'demo-travel-tenant',
        isActive: true,
        mustChangePassword: false,
        phoneVerified: true,
      };
    case 'PLATFORM_ADMIN':
      return {
        id: 'usr-superadmin-1',
        phone: '9999999999',
        fullName: 'State Transport Super Admin',
        role: 'PLATFORM_ADMIN',
        isActive: true,
        mustChangePassword: false,
        phoneVerified: true,
      };
    case 'PASSENGER':
    default:
      return {
        id: 'usr-passenger-1',
        phone: '7381319957',
        fullName: 'Passenger',
        role: 'PASSENGER',
        isActive: true,
        mustChangePassword: false,
        phoneVerified: true,
      };
  }
};

export const useNavigationStore = create<NavigationState>((set, get) => ({
  activeRole: 'PASSENGER',
  activeTab: 'HOME',
  isMobileNavOpen: false,
  isAuthenticated: true,
  user: getMockUser('PASSENGER'),
  unreadNotifsCount: 0,

  setActiveRole: (role: UserRole) => {
    set({
      activeRole: role,
      activeTab: 'HOME',
      isMobileNavOpen: false,
      user: getMockUser(role),
      unreadNotifsCount: role === 'PLATFORM_ADMIN' ? 9 : 0,
    });
  },

  setActiveTab: (tab: string) => {
    set({ activeTab: tab, isMobileNavOpen: false });
  },

  toggleMobileNav: () => {
    set({ isMobileNavOpen: !get().isMobileNavOpen });
  },

  setMobileNavOpen: (open: boolean) => {
    set({ isMobileNavOpen: open });
  },

  login: (role: UserRole = 'PASSENGER') => {
    set({
      isAuthenticated: true,
      activeRole: role,
      activeTab: 'HOME',
      user: getMockUser(role),
    });
  },

  logout: () => {
    set({
      isAuthenticated: false,
      isMobileNavOpen: false,
    });
  },
}));
