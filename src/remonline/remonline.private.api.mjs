import axios from 'axios';
import {
  getLatestPrivateRemonlineTokens,
  savePrivateRemonlineTokens,
} from './remonline.private.queries.mjs';

function buildCookieHeader({ refreshToken, accessToken }) {
  return `refresh_token=${refreshToken}; token=${accessToken}`;
}

function extractTokenFromSetCookie(setCookieHeader, name) {
  if (!Array.isArray(setCookieHeader)) {
    return null;
  }

  const prefix = `${name}=`;

  for (const header of setCookieHeader) {
    if (typeof header !== 'string') continue;
    const parts = header.split(';');
    const tokenPart = parts.find((p) => p.trim().startsWith(prefix));
    if (tokenPart) {
      return tokenPart.trim().substring(prefix.length);
    }
  }

  return null;
}

export class RemonlinePrivateApiClient {
  constructor() {
    this.axios = axios.create({
      baseURL: 'https://web.roapp.io',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://web.roapp.io',
        Referer: 'https://web.roapp.io/app/token/refresh',
      },
    });
  }

  async refreshTokens() {
    const latestTokens = await getLatestPrivateRemonlineTokens();

    if (!latestTokens) {
      throw new Error(
        'No private Remonline tokens found. Please seed remonline_private_api_tokens with an initial refresh_token and access_token.',
      );
    }

    const { refreshToken, accessToken } = latestTokens;

    const cookieHeader = buildCookieHeader({ refreshToken, accessToken });

    const response = await this.axios.post(
      '/app/token/refresh',
      {
        refresh_token: refreshToken,
      },
      {
        headers: {
          Cookie: cookieHeader,
        },
      },
    );

    const setCookieHeader = response.headers['set-cookie'];

    const newRefreshToken =
      extractTokenFromSetCookie(setCookieHeader, 'refresh_token') || refreshToken;
    const newAccessToken =
      extractTokenFromSetCookie(setCookieHeader, 'token') || accessToken;

    await savePrivateRemonlineTokens({
      refreshToken: newRefreshToken,
      accessToken: newAccessToken,
    });

    return {
      refreshToken: newRefreshToken,
      accessToken: newAccessToken,
    };
  }
}

