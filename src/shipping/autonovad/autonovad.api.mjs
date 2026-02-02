import axios from 'axios';
import {
  getAutonovadBaseUrl,
  isAuthError,
} from './autonovad.utils.mjs';

const TOKEN_LIFETIME_SEC = 300;
const REFRESH_BUFFER_SEC = 60;

class AutonovadAPIClient {
  constructor({ accessToken, refreshToken, baseUrl }) {
    this.baseUrl = baseUrl || getAutonovadBaseUrl();
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiresAt = Date.now() + TOKEN_LIFETIME_SEC * 1000;
    this.login = null;
    this.password = null;

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    this.axiosInstance.interceptors.request.use(async (config) => {
      if (this._isTokenExpiringSoon()) {
        await this._refreshAccessToken();
      }
      config.headers.Authorization = `Bearer ${this.accessToken}`;
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          error.response &&
          isAuthError(error.response.status) &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          await this._refreshAccessToken();
          originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
          return this.axiosInstance(originalRequest);
        }

        return Promise.reject(error);
      }
    );
  }

  _isTokenExpiringSoon() {
    const bufferMs = REFRESH_BUFFER_SEC * 1000;
    return Date.now() >= this.tokenExpiresAt - bufferMs;
  }

  async _refreshAccessToken() {
    if (this.refreshToken) {
      try {
        const response = await axios.get(
          `${this.baseUrl}/api/v1/auth/token/refresh/${this.refreshToken}`
        );
        const { access_token } = response.data;
        if (access_token) {
          this.accessToken = access_token;
          this.tokenExpiresAt = Date.now() + TOKEN_LIFETIME_SEC * 1000;
          return;
        }
      } catch (err) {
        console.warn('Autonovad token refresh failed, re-authenticating:', err?.message);
      }
    }

    if (this.login && this.password) {
      await this._authenticate();
    } else {
      throw new Error('Cannot refresh token: no refresh token or credentials');
    }
  }

  async _authenticate() {
    if (!this.login || !this.password) {
      throw new Error('Credentials not available for re-authentication.');
    }
    const response = await axios.post(
      `${this.baseUrl}/api/v1/auth/token`,
      { login: this.login, password: this.password },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { access_token, refresh_token } = response.data;
    if (!access_token) {
      throw new Error('Token not found in auth response.');
    }

    this.accessToken = access_token;
    this.refreshToken = refresh_token || this.refreshToken;
    this.tokenExpiresAt = Date.now() + TOKEN_LIFETIME_SEC * 1000;
    this.axiosInstance.defaults.headers.Authorization = `Bearer ${this.accessToken}`;
  }

  static async initialize({ login, password, baseUrl }) {
    if (!login || !password) {
      throw new Error('Autonovad login and password are required.');
    }

    const base = baseUrl || getAutonovadBaseUrl();

    const response = await axios.post(
      `${base}/api/v1/auth/token`,
      { login, password },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { access_token, refresh_token } = response.data;
    if (!access_token) {
      throw new Error('Token not found in auth response.');
    }

    const client = new AutonovadAPIClient({
      accessToken: access_token,
      refreshToken: refresh_token,
      baseUrl: base,
    });
    client.login = login;
    client.password = password;

    return client;
  }

  getAxiosInstance() {
    return this.axiosInstance;
  }

  handleApiError(error) {
    console.error('Autonovad API Error:');
    if (error.response) {
      console.error(
        `Status: ${error.response.status}`,
        error.response.data
      );
    } else {
      console.error('An unexpected error occurred:', error.message);
    }
    throw error;
  }
}

export async function createAutonovadClientFromEnv() {
  const login = process.env.AUTONOVAD_LOGIN;
  const password = process.env.AUTONOVAD_PASSWORD;
  const baseUrl = process.env.AUTONOVAD_API_BASE_URL;

  if (!login || !password) {
    throw new Error(
      'AUTONOVAD_LOGIN and AUTONOVAD_PASSWORD must be set in environment.'
    );
  }

  return AutonovadAPIClient.initialize({
    login,
    password,
    baseUrl: baseUrl || undefined,
  });
}

export default AutonovadAPIClient;
