import { autonovadAPI } from './warehouse.api.mjs';
import axios from 'axios';
// This would be your configured Axios instance
// const autonovadAPI = axios.create({ baseURL: 'https://autonovad.ua/' });
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
  // Note: We omit Content-Type and Cookie here as they are dynamic.
  // We also omit Content-Length as Axios handles it.
};
export async function loginAndGetCookies({ username, password }) {
  try {
    const loginUrl = 'https://autonovad.ua/service/checkCredentials.html';

    // The login payload
    const params = new URLSearchParams();
    params.append('login', username);
    params.append('pass', password);
    params.append('auth', '1');

    // Headers for THIS specific login request
    const loginHeaders = {
      ...staticHeaders,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    };

    console.log('Attempting to log in...');
    const response = await axios.post(loginUrl, params, {
      headers: loginHeaders,
    });

    // --- Step 2: Manually extract and process the 'set-cookie' header ---
    const setCookieHeader = response.headers['set-cookie'];

    if (!setCookieHeader) {
      console.error('Login failed: Did not receive any cookies.');
      return null;
    }

    // The 'set-cookie' header is an array of strings. We need to parse them.
    // We only want the 'key=value' part of each cookie string.
    const cookies = setCookieHeader.map((cookie) => cookie.split(';')[0]);
    console.log(cookies)
    // Join them into a single string for the 'Cookie' header
    const cookieHeaderString = cookies.join('; ');

    console.log('Login successful. Captured cookies:', cookieHeaderString);
    return cookieHeaderString;
  } catch (error) {
    console.error('Error during login:', error.message);
    return null;
  }
}
