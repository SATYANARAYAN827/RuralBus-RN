import { RoleNavigationConfig, UserRole } from '../types';

export const ROLE_NAVIGATION_CONFIGS: Record<UserRole, RoleNavigationConfig> = {
  PASSENGER: {
    role: 'PASSENGER',
    portalTitle: 'Passenger Portal',
    portalSubtitle: 'Live Bus Telemetry & Online Seat Reservation',
    icon: '🚌',
    roleBadge: 'PASSENGER',
    roleBadgeColor: '#00D488',
    roleBadgeBg: 'rgba(0, 212, 136, 0.15)',
    items: [
      { id: 'HOME', icon: '🏠', label: 'Home' },
      { id: 'FIND_BUS', icon: '🔍', label: 'Find Bus' },
      { id: 'TICKETS', icon: '🎫', label: 'My Tickets' },
      { id: 'PROFILE', icon: '👤', label: 'Profile' },
    ],
    bottomTabIds: ['HOME', 'FIND_BUS', 'TICKETS', 'PROFILE'],
  },

  DRIVER: {
    role: 'DRIVER',
    portalTitle: 'Driver Duty HUD',
    portalSubtitle: 'Live Telemetry & Turn-by-Turn Route Guidance',
    icon: '🚌',
    roleBadge: 'DRIVER',
    roleBadgeColor: '#2563eb',
    roleBadgeBg: 'rgba(37, 99, 235, 0.15)',
    items: [
      { id: 'HOME', icon: '🏠', label: 'Duty Home' },
      { id: 'MAP', icon: '🗺️', label: 'Map Radar', badge: 'Live', badgeBg: 'rgba(37, 99, 235, 0.25)', badgeColor: '#60a5fa' },
      { id: 'STOPS', icon: '📋', label: 'Stops Checklist' },
      { id: 'HISTORY', icon: '⏱️', label: 'Trip History' },
      { id: 'PROFILE', icon: '👤', label: 'Profile' },
    ],
    bottomTabIds: ['HOME', 'MAP', 'STOPS', 'PROFILE'],
  },

  CONDUCTOR: {
    role: 'CONDUCTOR',
    portalTitle: 'Conductor POS',
    portalSubtitle: 'Pre-departure Manifest & Smart QR Ticketing',
    icon: '🎫',
    roleBadge: 'CONDUCTOR',
    roleBadgeColor: '#00D488',
    roleBadgeBg: 'rgba(0, 212, 136, 0.15)',
    items: [
      { id: 'HOME', icon: '🏠', label: 'Home / My Trip' },
      { id: 'SCAN', icon: '📷', label: 'Scan Ticket', badge: 'QR', badgeBg: 'rgba(0, 212, 136, 0.25)', badgeColor: '#00D488' },
      { id: 'PASSENGERS', icon: '👥', label: 'Passengers' },
      { id: 'CASH_TICKETS', icon: '💵', label: 'Cash Tickets' },
      { id: 'PROFILE', icon: '👤', label: 'Profile' },
    ],
    bottomTabIds: ['HOME', 'SCAN', 'PASSENGERS', 'CASH_TICKETS'],
  },

  OPERATOR_ADMIN: {
    role: 'OPERATOR_ADMIN',
    portalTitle: 'Fleet Owner Portal',
    portalSubtitle: 'Transport Operator & Fleet Management',
    icon: '🏢',
    roleBadge: 'OPERATOR',
    roleBadgeColor: '#00D488',
    roleBadgeBg: 'rgba(0, 212, 136, 0.15)',
    items: [
      { id: 'HOME', icon: '📊', label: 'Overview', group: 'OPERATIONS' },
      { id: 'BUSES', icon: '🚌', label: 'My Fleet Buses', badge: '12', group: 'FLEET & DISPATCH' },
      { id: 'LIVE_MAP', icon: '📡', label: 'Live Fleet Radar', badge: 'Live', group: 'OPERATIONS' },
      { id: 'STAFF', icon: '👥', label: 'Staff Roster', badge: '18', group: 'FLEET & DISPATCH' },
      { id: 'ROUTES', icon: '🛣️', label: 'Routes & Stops', group: 'FLEET & DISPATCH' },
      { id: 'TRIPS', icon: '⏱️', label: 'Daily Trips', group: 'FLEET & DISPATCH' },
      { id: 'REVENUE', icon: '💰', label: 'Revenue & Collections', group: 'OPERATIONS' },
      { id: 'PROFILE', icon: '👤', label: 'Tenant Profile', group: 'SYSTEM' },
    ],
    bottomTabIds: ['HOME', 'BUSES', 'LIVE_MAP', 'PROFILE'],
  },

  PLATFORM_ADMIN: {
    role: 'PLATFORM_ADMIN',
    portalTitle: 'Super Admin Console',
    portalSubtitle: 'Statewide Multi-Tenant Operator Governance',
    icon: '⚡',
    roleBadge: 'SUPER ADMIN',
    roleBadgeColor: '#a855f7',
    roleBadgeBg: 'rgba(168, 85, 247, 0.15)',
    items: [
      { id: 'HOME', icon: '📊', label: 'Dashboard' },
      { id: 'OWNERS', icon: '🏢', label: 'Operators' },
      { id: 'STAFF', icon: '👥', label: 'Platform Staff' },
      { id: 'PROFILE', icon: '👤', label: 'Profile' },
    ],
    bottomTabIds: ['HOME', 'OWNERS', 'STAFF', 'PROFILE'],
  },
};
