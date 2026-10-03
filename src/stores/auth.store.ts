import { create } from 'zustand';
import { apiClient } from '../services/api.client';
import { authStorage } from '../services/authStorage';
import { API_CONFIG } from '../config/api.config';
import { UserProfile, AuthTokens, UserRole, LanguageCode } from '../types';
import { useNavigationStore } from '../navigation/navigation.store';

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
    id: 'faaaf9ea-6f46-4f75-adc9-6e84d4fbcdef',
    phone: '9876500000',
    fullName: 'State Transport Super Admin',
    email: 'superadmin@ruralbus.gov.in',
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
        if (secureTokens.refreshToken) {
          apiClient.setRefreshToken(secureTokens.refreshToken);
        }

        // Decode JWT payload to restore user context without a network round-trip.
        // The JWT is already verified by the backend on every request; this is only
        // used to re-hydrate the Zustand user slice for UI rendering & tenant routing.
        let restoredUser: UserProfile | null = null;
        try {
          const parts = secureTokens.accessToken.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(
              atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
            );
            if (payload?.sub && payload?.role) {
              restoredUser = {
                id: payload.sub,
                phone: payload.phone || '',
                fullName: payload.fullName || '',
                role: payload.role as UserRole,
                tenantId: payload.tenantId || undefined,
                isActive: true,
                mustChangePassword: payload.mustChangePassword ?? false,
                phoneVerified: payload.phoneVerified ?? true,
              };
            }
          }
        } catch {
          // Non-fatal: JWT decode failed (malformed token), user stays null
        }

        set({
          tokens: secureTokens,
          isAuthenticated: true,
          user: restoredUser,
        });

        // Sync restored user to navigation store for role-based routing
        if (restoredUser) {
          try {
            useNavigationStore.getState().setActiveRole(restoredUser.role, restoredUser);
            useNavigationStore.getState().login(restoredUser.role, restoredUser);
          } catch {}
        }
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

        // If phone wasn't populated by backend on user, ensure login phone is preserved
        if (!user.phone && /^\d{10}$/.test(identifier.trim())) {
          user.phone = identifier.trim();
        }

        // Set token in API client in-memory and secure memory storage
        apiClient.setAuthToken(tokens.accessToken);
        if (tokens.refreshToken) {
          apiClient.setRefreshToken(tokens.refreshToken);
        }
        await authStorage.setTokens(tokens);

        set({
          user,
          tokens,
          tenant: tenant || null,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Directly sync user into navigationStore so it reflects immediately
        try {
          useNavigationStore.getState().setActiveRole(user.role, user);
          useNavigationStore.getState().setUser(user);
        } catch {}
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
        const user = res.data.user;
        const tokens = res.data.tokens;

        if (tokens?.accessToken) {
          apiClient.setAuthToken(tokens.accessToken);
          if (tokens.refreshToken) {
            apiClient.setRefreshToken(tokens.refreshToken);
          }
          await authStorage.setTokens(tokens);

          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Sync into navigation store to automatically transition directly to the passenger portal
          try {
            useNavigationStore.getState().setActiveRole(user.role || 'PASSENGER', user);
            useNavigationStore.getState().login(user.role || 'PASSENGER', user);
            useNavigationStore.getState().setUser(user);
          } catch {}
          return;
        }

        // Fallback: If tokens were not attached directly, log in automatically with registered credentials
        await get().login(input.phone.trim(), input.password);
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
      const res: any = await apiClient.post(API_CONFIG.ENDPOINTS.OTP_REQUEST, {
        phone: phone.trim(),
        purpose,
      });

      const payload = res?.data || res;
      const simulatedOtp = payload?.simulatedOtp || payload?.data?.simulatedOtp || (res as any)?.simulatedOtp;
      const expiresInSeconds = payload?.expiresInSeconds || payload?.data?.expiresInSeconds || 300;

      set({ isLoading: false });
      return {
        simulatedOtp,
        expiresInSeconds,
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
    try {
      useNavigationStore.getState().setActiveRole(role, demoUser);
      useNavigationStore.getState().setUser(demoUser);
    } catch {}
  },

  logout: async () => {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.LOGOUT).catch(() => {});
    } catch {}

    apiClient.setAuthToken(null);
    apiClient.setRefreshToken(null);
    await authStorage.clearTokens();
    try {
      useNavigationStore.getState().logout();
    } catch {}

    set({
      user: null,
      tokens: null,
      tenant: null,
      isAuthenticated: false,
      error: null,
    });
  },
}));

// Automatically handle token expiry / unrecoverable 401s across the entire application
apiClient.setOnSessionExpired(async () => {
  const state = useAuthStore.getState();
  if (state.isAuthenticated) {
    apiClient.setAuthToken(null);
    apiClient.setRefreshToken(null);
    await authStorage.clearTokens();
    try {
      useNavigationStore.getState().logout();
    } catch {}
    useAuthStore.setState({
      user: null,
      tokens: null,
      tenant: null,
      isAuthenticated: false,
      error: 'Your session has expired. Please log in again to continue.',
    });
  }
});

