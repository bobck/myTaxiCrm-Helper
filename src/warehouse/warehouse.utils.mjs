import { autonovadAPI } from './warehouse.api.mjs';
import axios from 'axios';
const staticHeaders = {
  Accept: 'text/html,*/*;q=0.01',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Cache-Control': 'no-cache',
  Origin: 'https://autonovad.ua',
  Pragma: 'no-cache',
  Referer: 'https://autonovad.ua/index.html',
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  'X-Requested-With': 'XMLHttpRequest',
};
export async function autonovadAuthorization({ username, password }) {
  try {
    const loginUrl = '/service/checkCredentials.html';
    const params = new URLSearchParams();
    params.append('login', username);
    params.append('pass', password);
    params.append('auth', '1');
    const loginHeaders = {
      ...staticHeaders,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    };

    console.log('Attempting to log in...');
    const response = await autonovadAPI.post(loginUrl, params, {
      headers: loginHeaders,
    });
    const setCookieHeader = response.headers['set-cookie'];

    if (!setCookieHeader) {
      console.error('Login failed: Did not receive any cookies.');
      return null;
    }

    const cookies = setCookieHeader.map((cookie) => cookie.split(';')[0]);
    const cookieHeaderString = cookies.join('; ');

    console.log('Login successful. Captured cookies:', { cookies });
    return cookieHeaderString;
  } catch (error) {
    console.error('Error during login:', error.message);
    return null;
  }
}
