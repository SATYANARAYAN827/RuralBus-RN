/**
 * Canonical Types for RuralBus React Native Frontend
 */

export type UserRole =
  | 'PASSENGER'
  | 'DRIVER'
  | 'CONDUCTOR'
  | 'OPERATOR_ADMIN'
  | 'PLATFORM_ADMIN';

export type LanguageCode = 'EN' | 'OD' | 'HI';
export type ThemeMode = 'light' | 'dark';

export interface UserProfile {
  id: string;
  phone: string;
  fullName: string;
  email?: string | null;
  role: UserRole;
  tenantId?: string | null;
  age?: number | null;
  gender?: 'MALE' | 'FEMALE' | 'THIRD_GENDER' | null;
  isActive: boolean;
  mustChangePassword: boolean;
  phoneVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export type PassengerTab = 'HOME' | 'FIND_BUS' | 'TICKETS' | 'PROFILE';
export type DriverTab = 'HOME' | 'MAP' | 'STOPS' | 'HISTORY' | 'PROFILE';
export type ConductorTab = 'HOME' | 'SCAN' | 'PASSENGERS' | 'CASH_TICKETS' | 'PROFILE';
export type OwnerTab = 'HOME' | 'BUSES' | 'LIVE_MAP' | 'STAFF' | 'ROUTES' | 'TRIPS' | 'REVENUE' | 'PROFILE';
export type SuperAdminTab = 'HOME' | 'OWNERS' | 'BUSES' | 'STAFF' | 'ROUTES' | 'TRIPS' | 'REQUESTS' | 'PROFILE';

export * from './navigation.types';
export * from './passenger.types';
export * from './driver.types';
export * from './conductor.types';
export * from './operator.types';
export * from './superadmin.types';
export type OperatorTab = OwnerTab;
