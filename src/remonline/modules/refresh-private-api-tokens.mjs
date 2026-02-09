import { RemonlinePrivateApiClient } from '../remonline.private.api.mjs';

export async function refreshPrivateApiTokensOnce() {
  console.log({
    time: new Date(),
    message: 'refreshPrivateApiTokensOnce (manual)',
  });

  const client = new RemonlinePrivateApiClient();
  await client.refreshTokens();

  console.log({
    time: new Date(),
    message: 'refreshPrivateApiTokensOnce finished',
  });
}

if (process.env.ENV == 'TEST') {
  await refreshPrivateApiTokensOnce();
}

