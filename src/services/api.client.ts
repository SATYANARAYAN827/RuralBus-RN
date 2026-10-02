import { API_CONFIG } from '../config/api.config';

class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private onSessionExpiredCallback: (() => void) | null = null;

  setOnSessionExpired(callback: (() => void) | null) {
    this.onSessionExpiredCallback = callback;
  }

  setAuthToken(token: string | null) {
    this.token = token;
  }

  getAuthToken(): string | null {
    return this.token;
  }

  setRefreshToken(refreshToken: string | null) {
    this.refreshToken = refreshToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * Attempts to acquire a fresh access token using either the stored refresh token
   * or automated platform administration session in browser runtime.
   */
  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        // Strategy 1: Standard JWT refresh endpoint
        if (this.refreshToken) {
          const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFRESH}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({ refreshToken: this.refreshToken }),
          });

          if (res.ok) {
            const json = await res.json().catch(() => ({}));
            const newAccess = json.data?.tokens?.accessToken;
            const newRefresh = json.data?.tokens?.refreshToken;
            if (newAccess) {
              this.token = newAccess;
              if (newRefresh) {
                this.refreshToken = newRefresh;
              }
              return newAccess;
            }
          }
        }

        // Clear invalid token if refresh was unsuccessful
        this.token = null;
        this.refreshToken = null;
        if (this.onSessionExpiredCallback) {
          this.onSessionExpiredCallback();
        }
        return null;
      } catch {
        this.token = null;
        this.refreshToken = null;
        if (this.onSessionExpiredCallback) {
          this.onSessionExpiredCallback();
        }
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit & { _isRetry?: boolean } = {}
  ): Promise<{ success: boolean; data: T; message?: string }> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const isPublicAuthEndpoint =
      endpoint.includes('/auth/login') ||
      endpoint.includes('/auth/refresh') ||
      endpoint.includes('/auth/register') ||
      endpoint.includes('/auth/otp') ||
      endpoint.includes('/auth/password-reset');

    if (this.token && !isPublicAuthEndpoint) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const validationDetailMsg =
          Array.isArray(json.error?.details) && json.error.details.length > 0
            ? json.error.details[0]?.message
            : null;

        const errorMsg =
          validationDetailMsg ||
          (typeof json.error === 'object' && json.error?.message) ||
          json.message ||
          (typeof json.error === 'string' ? json.error : null) ||
          `HTTP ${response.status}: Request failed`;

        const isAuthError =
          response.status === 401 ||
          (typeof errorMsg === 'string' &&
            (errorMsg.toLowerCase().includes('expired') ||
              errorMsg.toLowerCase().includes('token')));

        // Automatically refresh expired token and transparently retry the request once
        if (
          isAuthError &&
          !options._isRetry &&
          !endpoint.includes('/auth/login') &&
          !endpoint.includes('/auth/refresh')
        ) {
          const freshToken = await this.refreshAccessToken();
          if (freshToken) {
            return this.request<T>(endpoint, {
              ...options,
              _isRetry: true,
            });
          }
        }

        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          this.token = null;
          this.refreshToken = null;
          if (this.onSessionExpiredCallback) {
            this.onSessionExpiredCallback();
          }
        }

        throw new Error(errorMsg);
      }

      return json;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  get<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  put<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  patch<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  delete<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();
