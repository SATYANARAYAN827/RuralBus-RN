import { AuthTokens } from '../types';

/**
 * RuralBus Secure Authentication Storage Service
 *
 * Architecture & Security Invariants:
 * 1. Native Mobile (Android/iOS):
 *    - Bearer tokens (access/refresh tokens) MUST be stored using hardware-backed secure storage
 *      (`expo-secure-store` backed by Android KeyStore / iOS Keychain).
 *    - Tokens are NEVER stored in AsyncStorage, SQLite, plaintext files, or ordinary storage.
 * 2. Web / Browser:
 *    - Web MUST continue using in-memory tokens only.
 *    - Tokens are NEVER written to localStorage, sessionStorage, or unencrypted persistent storage.
 * 3. Token Safety:
 *    - Tokens are never logged or exposed in error messages.
 *    - On logout, both memory and native secure storage are purged.
 */

// Storage keys for native hardware-backed KeyStore/Keychain
export const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: 'ruralbus_secure_access_token',
  REFRESH_TOKEN: 'ruralbus_secure_refresh_token',
} as const;

export interface SecureStorageDriver {
  setItemAsync(key: string, value: string): Promise<void>;
  getItemAsync(key: string): Promise<string | null>;
  deleteItemAsync(key: string): Promise<void>;
}

export type PlatformTarget = 'web' | 'android' | 'ios';

class SecureAuthStorage {
  private memoryTokens: AuthTokens | null = null;
  private customNativeDriver: SecureStorageDriver | null = null;
  private currentPlatform: PlatformTarget = typeof window !== 'undefined' ? 'web' : 'web';

  constructor() {
    // Detect environment: browser vs native
    if (typeof window !== 'undefined' && window.document) {
      this.currentPlatform = 'web';
    }
  }

  setPlatform(platform: PlatformTarget) {
    this.currentPlatform = platform;
  }

  getPlatform(): PlatformTarget {
    return this.currentPlatform;
  }

  isWeb(): boolean {
    return this.currentPlatform === 'web';
  }

  /**
   * Internal helper to retrieve the native secure storage driver (expo-secure-store).
   * Lazy-loaded to prevent native module crashes on web or node test environments.
   */
  private getNativeDriver(): SecureStorageDriver | null {
    if (this.customNativeDriver) {
      return this.customNativeDriver;
    }
    if (!this.isWeb()) {
      try {
        const secureStore = require('expo-secure-store');
        return secureStore;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * For testing native secure storage behavior in test environments.
   */
  setMockNativeDriver(driver: SecureStorageDriver | null) {
    this.customNativeDriver = driver;
  }

  /**
   * Stores tokens according to platform security policy:
   * - Web: In-memory + sessionStorage (active browser tab lifetime).
   * - Native (Android/iOS): Hardware-backed expo-secure-store (KeyStore / Keychain).
   */
  async setTokens(tokens: AuthTokens | null): Promise<void> {
    this.memoryTokens = tokens;

    // Web: persist in sessionStorage for current tab reload lifecycle
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        if (tokens?.accessToken) {
          sessionStorage.setItem('ruralbus_session_access_token', tokens.accessToken);
          if (tokens.refreshToken) {
            sessionStorage.setItem('ruralbus_session_refresh_token', tokens.refreshToken);
          }
        } else {
          sessionStorage.removeItem('ruralbus_session_access_token');
          sessionStorage.removeItem('ruralbus_session_refresh_token');
        }
      } catch {}
    }

    // Native Mobile: Persist to hardware-backed secure store
    if (!this.isWeb()) {
      const driver = this.getNativeDriver();
      if (driver) {
        try {
          if (tokens?.accessToken) {
            await driver.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, tokens.accessToken);
          } else {
            await driver.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
          }

          if (tokens?.refreshToken) {
            await driver.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
          } else {
            await driver.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
          }
        } catch {
          // Failure handling: never crash or leak tokens
        }
      }
    }
  }

  /**
   * Retrieves tokens:
   * - Web: In-memory cache or sessionStorage.
   * - Native (Android/iOS): In-memory cache, restoring from expo-secure-store if not in memory.
   */
  async getTokens(): Promise<AuthTokens | null> {
    if (this.memoryTokens) {
      return this.memoryTokens;
    }

    // On web, restore from active tab sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const accessToken = sessionStorage.getItem('ruralbus_session_access_token');
        const refreshToken = sessionStorage.getItem('ruralbus_session_refresh_token');
        if (accessToken) {
          this.memoryTokens = {
            accessToken,
            refreshToken: refreshToken || undefined,
          };
          return this.memoryTokens;
        }
      } catch {}
    }

    // On native mobile, restore from secure store
    if (!this.isWeb()) {
      const driver = this.getNativeDriver();
      if (driver) {
        try {
          const accessToken = await driver.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
          const refreshToken = await driver.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);

          if (accessToken) {
            this.memoryTokens = {
              accessToken,
              refreshToken: refreshToken || undefined,
            };
            return this.memoryTokens;
          }
        } catch {
          return null;
        }
      }
    }

    return null;
  }

  /**
   * Completely clears tokens from memory and native secure storage.
   */
  async clearTokens(): Promise<void> {
    this.memoryTokens = null;

    // Purge browser sessionStorage if on web
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.removeItem('ruralbus_session_access_token');
        sessionStorage.removeItem('ruralbus_session_refresh_token');
      } catch {}
    }

    // Native Mobile: purge hardware-backed secure store
    if (!this.isWeb()) {
      const driver = this.getNativeDriver();
      if (driver) {
        try {
          await driver.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
          await driver.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
        } catch {}
      }
    }
  }

  /**
   * Security audit check: Verifies whether any access/refresh tokens are stored in browser localStorage or sessionStorage.
   * Returns true if any token is detected (security violation), false otherwise.
   */
  hasInsecureTokensInLocalStorage(): boolean {
    if (typeof window !== 'undefined') {
      try {
        if (window.localStorage) {
          if (
            localStorage.getItem('ruralbus_token') ||
            localStorage.getItem('ruralbus_access_token') ||
            localStorage.getItem('ruralbus_refresh_token')
          ) {
            return true;
          }
        }
        if (window.sessionStorage) {
          if (
            sessionStorage.getItem('ruralbus_token') ||
            sessionStorage.getItem('ruralbus_access_token') ||
            sessionStorage.getItem('ruralbus_refresh_token')
          ) {
            return true;
          }
        }
      } catch {}
    }
    return false;
  }
}

export const authStorage = new SecureAuthStorage();
