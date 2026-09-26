import { create } from 'zustand';
import { apiClient } from '../services/api.client';
import { authStorage } from '../services/authStorage';
import { API_CONFIG } from '../config/api.config';
import { UserProfile, AuthTokens, UserRole, LanguageCode } from '../types';

export interface RegisterInput {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  role?: UserRole;
}

export interface AuthState {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  tenant: { id: string; name: string; slug: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lang: LanguageCode;

  setLang: (lang: LanguageCode) => void;
  initialize: () => Promise<void>;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  requestOtp: (phone: string, purpose?: string) => Promise<{ simulatedOtp?: string; expiresInSeconds: number }>;
  verifyOtp: (phone: string, otp: string, purpose?: string) => Promise<{ resetToken?: string }>;
  resetPassword: (resetToken: string, newPassword: string) => Promise<void>;
  forceChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  loginAsDemoRole: (role: UserRole) => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

const STORAGE_KEYS = {
  LANG: 'ruralbus_lang',
};

export const DEMO_USER_BY_ROLE: Record<UserRole, UserProfile> = {
  PASSENGER: {
    id: 'usr-passenger-demo',
    phone: '7381319957',
    fullName: 'Rahul Sharma (Passenger)',
    role: 'PASSENGER',
    isActive: true,
    mustChangePassword: false,
    phoneVerified: true,
  },
  DRIVER: {
    id: 'usr-driver-demo',
    phone: '9876543202',
    fullName: 'Bishnu Charan Sahoo',
    role: 'DRIVER',
    tenantId: 'demo-travel-tenant',
    isActive: true,
    mustChangePassword: false,
    phoneVerified: true,
  },
  CONDUCTOR: {
    id: 'usr-conductor-demo',
    phone: '9876543203',
    fullName: 'Demo Conductor',
    role: 'CONDUCTOR',
    tenantId: 'demo-travel-tenant',
    isActive: true,
    mustChangePassword: false,
    phoneVerified: true,
  },
  OPERATOR_ADMIN: {
    id: 'usr-operator-demo',
    phone: '9861465410',
    fullName: 'Satya Demo Travel',
    role: 'OPERATOR_ADMIN',
    tenantId: 'demo-travel-tenant',
    isActive: true,
    mustChangePassword: false,
    phoneVerified: true,
  },
  PLATFORM_ADMIN: {
    id: 'usr-superadmin-demo',
    phone: '9999999999',
    fullName: 'State Transport Super Admin',
    role: 'PLATFORM_ADMIN',
    isActive: true,
    mustChangePassword: false,
    phoneVerified: true,
  },
};

const getInitialLang = (): LanguageCode => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LANG) as LanguageCode | null;
      if (saved === 'EN' || saved === 'OD' || saved === 'HI') {
        return saved;
      }
    } catch {}
  }
  return 'EN';
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  tenant: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  lang: getInitialLang(),

  setLang: (lang: LanguageCode) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEYS.LANG, lang);
      } catch {}
    }
    set({ lang });
  },

  clearError: () => set({ error: null }),

  initialize: async () => {
    // Purge any insecure legacy tokens from browser storage if on web
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem('ruralbus_token');
        localStorage.removeItem('ruralbus_access_token');
        localStorage.removeItem('ruralbus_refresh_token');
      } catch {}
    }

    // On native mobile (Android/iOS), restore session from secure native storage only
    try {
      const secureTokens = await authStorage.getTokens();
      if (secureTokens?.accessToken) {
        apiClient.setAuthToken(secureTokens.accessToken);
        set({
          tokens: secureTokens,
          isAuthenticated: true,
        });
      }
    } catch {}
  },

  login: async (identifier: string, password: string, _rememberMe = true) => {
    set({ isLoading: true, error: null });
    try {
      // Connect to Fastify API endpoint - backend authoritative authentication
      const res = await apiClient.post<{
        user: UserProfile;
        tokens: AuthTokens;
        tenant?: { id: string; name: string; slug: string };
      }>(API_CONFIG.ENDPOINTS.LOGIN, {
        identifier: identifier.trim(),
        password,
      });

      if (res.data?.user && res.data?.tokens) {
        const { user, tokens, tenant } = res.data;

        // Set token in API client in-memory and secure memory storage
        apiClient.setAuthToken(tokens.accessToken);
        await authStorage.setTokens(tokens);

        set({
          user,
          tokens,
          tenant: tenant || null,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return;
      }

      throw new Error(res.message || 'Login failed. Invalid credentials returned by server.');
    } catch (err: any) {
      // Security Enforcement:
      // Network failure or rejected credentials MUST NOT authenticate locally.
      // Explicitly clear auth state and propagate the error.
      apiClient.setAuthToken(null);
      await authStorage.clearTokens();

      set({
        user: null,
        tokens: null,
        tenant: null,
        isAuthenticated: false,
        isLoading: false,
        error: err?.message || 'Login failed. Please check your credentials and network connection.',
      });
      throw err;
    }
  },

  register: async (input: RegisterInput) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post<{
        user: UserProfile;
        tokens?: AuthTokens;
      }>(API_CONFIG.ENDPOINTS.REGISTER, {
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || undefined,
        password: input.password,
        role: input.role || 'PASSENGER',
      });

      if (res.data?.user) {
        set({ isLoading: false, error: null });
        return;
      }
      throw new Error(res.message || 'Registration failed.');
    } catch (err: any) {
      // Security Enforcement:
      // Registration failure or network error must NEVER report success.
      set({ isLoading: false, error: err?.message || 'Registration failed.' });
      throw err;
    }
  },

  requestOtp: async (phone: string, purpose = 'REGISTRATION') => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post<{
        simulatedOtp?: string;
        expiresInSeconds?: number;
      }>(API_CONFIG.ENDPOINTS.OTP_REQUEST, {
        phone: phone.trim(),
        purpose,
      });

      set({ isLoading: false });
      return {
        simulatedOtp: res.data?.simulatedOtp,
        expiresInSeconds: res.data?.expiresInSeconds || 300,
      };
    } catch (err: any) {
      // Security Enforcement:
      // Backend OTP request failure must NOT produce a fallback mock OTP.
      set({ isLoading: false, error: err?.message || 'Failed to request OTP from server.' });
      throw err;
    }
  },

  verifyOtp: async (phone: string, otp: string, purpose = 'REGISTRATION') => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post<{
        resetToken?: string;
      }>(API_CONFIG.ENDPOINTS.OTP_VERIFY, {
        phone: phone.trim(),
        otp: otp.trim(),
        purpose,
      });

      set({ isLoading: false });
      return { resetToken: res.data?.resetToken };
    } catch (err: any) {
      // Security Enforcement:
      // Client-side hardcoded OTP codes are strictly rejected.
      // Only the authoritative Fastify backend verification is accepted.
      set({ isLoading: false, error: err?.message || 'Invalid OTP code.' });
      throw err;
    }
  },

  resetPassword: async (resetToken: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.PASSWORD_RESET, {
        resetToken,
        newPassword,
      });
      set({ isLoading: false, error: null });
    } catch (err: any) {
      // Security Enforcement:
      // Network/backend failure must NOT be swallowed.
      set({ isLoading: false, error: err?.message || 'Password reset failed.' });
      throw err;
    }
  },

  forceChangePassword: async (currentPassword: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.FORCE_CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
      });

      // Clear flag ONLY after backend confirms success
      const current = get().user;
      if (current) {
        set({ user: { ...current, mustChangePassword: false }, isLoading: false, error: null });
      } else {
        set({ isLoading: false, error: null });
      }
    } catch (err: any) {
      // Security Enforcement:
      // On network failure or rejection, mustChangePassword MUST NOT be cleared.
      set({ isLoading: false, error: err?.message || 'Failed to update password.' });
      throw err;
    }
  },

  loginAsDemoRole: (role: UserRole) => {
    // Security Enforcement:
    // Demo login is strictly prohibited in production builds and does not create mock JWT tokens.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Demo authentication is disabled in production builds.');
    }

    const demoUser = DEMO_USER_BY_ROLE[role];
    set({
      user: demoUser,
      tokens: null, // No mock JWT tokens
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  },

  logout: async () => {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.LOGOUT).catch(() => {});
    } catch {}

    apiClient.setAuthToken(null);
    await authStorage.clearTokens();

    set({
      user: null,
      tokens: null,
      tenant: null,
      isAuthenticated: false,
      error: null,
    });
  },
}));
