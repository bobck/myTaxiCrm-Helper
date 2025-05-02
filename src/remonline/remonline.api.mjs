import fetch from 'node-fetch';
import { saveRemonlineToken, getRemonlineToken } from './remonline.queries.mjs';

async function _getNewToken() {
  const tokenLifetime = 86400000;
  const validTo = new Date().getTime() + tokenLifetime;

  const params = new URLSearchParams();
  params.append('api_key', process.env.REMONLINE_API_KEY);

  const response = await fetch(`${process.env.REMONLINE_API}/token/new`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  // console.log(response.status, params, `${process.env.REMONLINE_API}/token/new`)
  const data = await response.json();
  const { token } = data;
  await saveRemonlineToken({ token, validTo });
  return { token };
}

export async function remonlineTokenToEnv(forceUpdate) {
  const now = new Date().getTime() + 60000;
  const result = await getRemonlineToken({ now });
  const { token } = result || (await _getNewToken());

  if (forceUpdate) {
    const { token } = await _getNewToken();
    process.env.REMONLINE_API_TOKEN = token;
    console.log({token})
    return;
  }
  process.env.REMONLINE_API_TOKEN = token;
  return;
}
