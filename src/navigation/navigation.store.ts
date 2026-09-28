import { create } from 'zustand';
import { UserRole, UserProfile } from '../types';

interface NavigationState {
  activeRole: UserRole;
  activeTab: string;
  isMobileNavOpen: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
  unreadNotifsCount: number;

  setActiveRole: (role: UserRole, customUser?: UserProfile | null) => void;
  setActiveTab: (tab: string) => void;
  toggleMobileNav: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setUser: (user: UserProfile | null) => void;
  login: (role?: UserRole, customUser?: UserProfile | null) => void;
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
        id: 'faaaf9ea-6f46-4f75-adc9-6e84d4fbcdef',
        phone: '9876500000',
        fullName: 'State Transport Super Admin',
        email: 'superadmin@ruralbus.gov.in',
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
  isAuthenticated: false,
  user: null,
  unreadNotifsCount: 0,

  setUser: (user: UserProfile | null) => {
    set({ user });
  },

  setActiveRole: (role: UserRole, customUser?: UserProfile | null) => {
    const current = customUser !== undefined 
      ? customUser 
      : (get().user?.role === role ? get().user : getMockUser(role));
    set({
      activeRole: role,
      activeTab: 'HOME',
      isMobileNavOpen: false,
      user: current,
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

  login: (role: UserRole = 'PASSENGER', customUser?: UserProfile | null) => {
    set({
      isAuthenticated: true,
      activeRole: role,
      activeTab: 'HOME',
      user: customUser !== undefined ? customUser : getMockUser(role),
    });
  },

  logout: () => {
    set({
      isAuthenticated: false,
      user: null,
      isMobileNavOpen: false,
    });
  },
}));
