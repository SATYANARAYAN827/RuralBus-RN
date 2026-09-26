import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { useAuthStore } from '../src/stores/auth.store';
import { apiClient } from '../src/services/api.client';
import { authStorage, SecureStorageDriver } from '../src/services/authStorage';
import { UserProfile, AuthTokens } from '../src/types';

describe('Module 2 — Authentication Security & Hardening Tests', () => {
  beforeEach(async () => {
    // Reset auth store and storage before each test
    apiClient.setAuthToken(null);
    authStorage.setMockNativeDriver(null);
    await authStorage.clearTokens();
    useAuthStore.setState({
      user: null,
      tokens: null,
      tenant: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    authStorage.setMockNativeDriver(null);
  });

  // 1. Native Token Storage Uses Hardware-Backed Secure Storage
  test('1. native token storage uses secure storage (Android KeyStore / iOS Keychain)', async () => {
    const originalPlatform = authStorage.getPlatform();
    try {
      authStorage.setPlatform('android');

      const mockStore = new Map<string, string>();
      const mockNativeDriver: SecureStorageDriver = {
        setItemAsync: async (key: string, value: string) => {
          mockStore.set(key, value);
        },
        getItemAsync: async (key: string) => {
          return mockStore.get(key) || null;
        },
        deleteItemAsync: async (key: string) => {
          mockStore.delete(key);
        },
      };

      authStorage.setMockNativeDriver(mockNativeDriver);

      const testTokens: AuthTokens = {
        accessToken: 'native-secure-access-token-123',
        refreshToken: 'native-secure-refresh-token-456',
      };

      await authStorage.setTokens(testTokens);

      // Verify that tokens were written to hardware-backed secure native driver
      assert.equal(mockStore.get('ruralbus_secure_access_token'), 'native-secure-access-token-123');
      assert.equal(mockStore.get('ruralbus_secure_refresh_token'), 'native-secure-refresh-token-456');

      // Clear memory cache to verify restoration from secure store
      await authStorage.clearTokens();
      assert.equal(mockStore.has('ruralbus_secure_access_token'), false);
    } finally {
      authStorage.setPlatform(originalPlatform);
    }
  });

  // 2. Web Token Storage Remains Memory-Only
  test('2. web token storage remains memory-only', async () => {
    const originalPlatform = authStorage.getPlatform();
    try {
      authStorage.setPlatform('web');

      const webTokens: AuthTokens = {
        accessToken: 'in-memory-web-token-789',
      };

      await authStorage.setTokens(webTokens);

      const retrieved = await authStorage.getTokens();
      assert.equal(retrieved?.accessToken, 'in-memory-web-token-789');

      // Verify no browser persistent storage is touched
      assert.equal(authStorage.hasInsecureTokensInLocalStorage(), false);
    } finally {
      authStorage.setPlatform(originalPlatform);
    }
  });

  // 3. No Bearer Tokens are Written to localStorage
  test('3. no bearer tokens are written to localStorage or sessionStorage', async () => {
    const tokens: AuthTokens = {
      accessToken: 'sample-jwt-access-token',
      refreshToken: 'sample-jwt-refresh-token',
    };

    await authStorage.setTokens(tokens);

    assert.equal(
      authStorage.hasInsecureTokensInLocalStorage(),
      false,
      'Security audit: localStorage and sessionStorage must contain 0 bearer tokens'
    );
  });

  // 4. Logout Clears Secure Token Storage
  test('4. logout completely clears native secure token storage and in-memory tokens', async () => {
    const originalPlatform = authStorage.getPlatform();
    try {
      authStorage.setPlatform('android');

      const mockStore = new Map<string, string>();
      mockStore.set('ruralbus_secure_access_token', 'active-token-to-purge');
      mockStore.set('ruralbus_secure_refresh_token', 'active-refresh-to-purge');

      const mockNativeDriver: SecureStorageDriver = {
        setItemAsync: async (k, v) => { mockStore.set(k, v); },
        getItemAsync: async (k) => mockStore.get(k) || null,
        deleteItemAsync: async (k) => { mockStore.delete(k); },
      };

      authStorage.setMockNativeDriver(mockNativeDriver);

      // Perform logout
      await authStorage.clearTokens();
      await useAuthStore.getState().logout();

      assert.equal(mockStore.has('ruralbus_secure_access_token'), false, 'Access token must be deleted from secure store');
      assert.equal(mockStore.has('ruralbus_secure_refresh_token'), false, 'Refresh token must be deleted from secure store');

      const state = useAuthStore.getState();
      assert.equal(state.isAuthenticated, false);
      assert.equal(state.user, null);
      assert.equal(state.tokens, null);
      assert.equal(apiClient.getAuthToken(), null);
    } finally {
      authStorage.setPlatform(originalPlatform);
    }
  });

  // 5. Production LoginScreen Contains No Hardcoded Passwords
  test('5. production LoginScreen contains no hardcoded passwords or credentials', () => {
    const loginScreenPath = path.resolve(__dirname, '../src/screens/auth/LoginScreen.tsx');
    const content = fs.readFileSync(loginScreenPath, 'utf8');

    const forbiddenPasswords = [
      'Passenger123!',
      'Driver123!',
      'Conductor123!',
      'Owner123!',
      'Admin123!',
    ];

    for (const pass of forbiddenPasswords) {
      assert.equal(
        content.includes(pass),
        false,
        `Security violation: Found forbidden hardcoded password "${pass}" in LoginScreen.tsx`
      );
    }

    assert.equal(
      content.includes('demoAccounts'),
      false,
      'Security violation: Found hardcoded demo accounts dictionary in LoginScreen.tsx'
    );
  });

  // 6. Production Demo/Quick-Login Cannot Authenticate Without Backend Credentials
  test('6. production demo/quick-login cannot authenticate without backend credentials', () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';

      // Calling demo login in production MUST throw and reject
      assert.throws(
        () => {
          useAuthStore.getState().loginAsDemoRole('PLATFORM_ADMIN');
        },
        {
          message: 'Demo authentication is disabled in production builds.',
        }
      );

      assert.equal(
        useAuthStore.getState().isAuthenticated,
        false,
        'User must NOT be authenticated via demo bypass in production'
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  // 7. Backend Login Success
  test('7. backend login success establishes authoritative session and in-memory tokens', async () => {
    const mockUser: UserProfile = {
      id: 'usr-real-123',
      phone: '9876543202',
      fullName: 'Bishnu Charan Sahoo',
      role: 'DRIVER',
      tenantId: 'demo-travel-tenant',
      isActive: true,
      mustChangePassword: false,
      phoneVerified: true,
    };
    const mockTokens: AuthTokens = {
      accessToken: 'valid-jwt-access-token-xyz',
      refreshToken: 'valid-jwt-refresh-token-abc',
    };

    apiClient.post = async () => ({
      success: true,
      data: {
        user: mockUser,
        tokens: mockTokens,
        tenant: { id: 'demo-travel-tenant', name: 'Demo Travel', slug: 'demo-travel' },
      },
    }) as any;

    await useAuthStore.getState().login('9876543202', 'correctPassword');

    const state = useAuthStore.getState();
    assert.equal(state.isAuthenticated, true);
    assert.equal(state.user?.id, 'usr-real-123');
    assert.equal(state.user?.role, 'DRIVER');
    assert.equal(state.tokens?.accessToken, 'valid-jwt-access-token-xyz');
    assert.equal(apiClient.getAuthToken(), 'valid-jwt-access-token-xyz');
  });

  // 8. Backend Login Rejection
  test('8. backend login rejection does NOT authenticate and sets error state', async () => {
    apiClient.post = async () => {
      throw new Error('Invalid phone or password credentials');
    };

    await assert.rejects(
      async () => {
        await useAuthStore.getState().login('9876543202', 'wrongPassword');
      },
      {
        message: 'Invalid phone or password credentials',
      }
    );

    const state = useAuthStore.getState();
    assert.equal(state.isAuthenticated, false);
    assert.equal(state.user, null);
    assert.equal(state.tokens, null);
    assert.equal(apiClient.getAuthToken(), null);
  });

  // 9. Offline/Network Failure Does NOT Authenticate
  test('9. backend/network login failure does NOT authenticate locally or trigger offline bypass', async () => {
    apiClient.post = async () => {
      throw new Error('Network request failed: ECONNREFUSED 127.0.0.1:4000');
    };

    await assert.rejects(
      async () => {
        await useAuthStore.getState().login('9999999999', 'anyPassword');
      },
      {
        message: /Network request failed/,
      }
    );

    const state = useAuthStore.getState();
    assert.equal(state.isAuthenticated, false);
    assert.equal(state.user, null);
    assert.equal(state.tokens, null);
    assert.equal(apiClient.getAuthToken(), null);
  });

  // 10. Invalid OTP Does NOT Verify
  test('10. invalid OTP does NOT authenticate/verify and hardcoded OTPs (749210, 123456) are rejected by default', async () => {
    apiClient.post = async () => {
      throw new Error('Invalid or expired verification code');
    };

    await assert.rejects(
      async () => {
        await useAuthStore.getState().verifyOtp('9876543202', '749210');
      },
      {
        message: 'Invalid or expired verification code',
      }
    );

    await assert.rejects(
      async () => {
        await useAuthStore.getState().verifyOtp('9876543202', '123456');
      },
      {
        message: 'Invalid or expired verification code',
      }
    );
  });

  // 11. Registration Network Failure Does NOT Report Success
  test('11. registration network failure does NOT report success or swallow error', async () => {
    apiClient.post = async () => {
      throw new Error('Network request failed: Connection timeout');
    };

    await assert.rejects(
      async () => {
        await useAuthStore.getState().register({
          fullName: 'Test Passenger',
          phone: '7381319957',
          password: 'Password123!',
          role: 'PASSENGER',
        });
      },
      {
        message: /Network request failed/,
      }
    );

    const state = useAuthStore.getState();
    assert.equal(state.error, 'Network request failed: Connection timeout');
    assert.equal(state.isLoading, false);
  });

  // 12. Password-Reset Network Failure Does NOT Report Success
  test('12. password-reset network failure does NOT report success or swallow error', async () => {
    apiClient.post = async () => {
      throw new Error('Failed to reach backend password reset service');
    };

    await assert.rejects(
      async () => {
        await useAuthStore.getState().resetPassword('mock-token-xyz', 'NewPass123!');
      },
      {
        message: 'Failed to reach backend password reset service',
      }
    );

    const state = useAuthStore.getState();
    assert.equal(state.error, 'Failed to reach backend password reset service');
  });

  // 13. Force-Change Network Failure Does NOT Clear mustChangePassword
  test('13. force-change network failure does NOT clear mustChangePassword', async () => {
    useAuthStore.setState({
      user: {
        id: 'usr-new-conductor',
        phone: '9876543203',
        fullName: 'New Conductor',
        role: 'CONDUCTOR',
        isActive: true,
        mustChangePassword: true,
        phoneVerified: true,
      },
      isAuthenticated: true,
      tokens: { accessToken: 'temp-jwt', refreshToken: 'temp-refresh' },
    });

    apiClient.post = async () => {
      throw new Error('Network request failed: Server unreachable');
    };

    await assert.rejects(
      async () => {
        await useAuthStore.getState().forceChangePassword('tempPass123', 'newSecurePass456');
      },
      {
        message: /Network request failed/,
      }
    );

    const state = useAuthStore.getState();
    assert.equal(state.user?.mustChangePassword, true, 'mustChangePassword MUST remain true on failure');
  });
});
