import { CronJob } from 'cron';
import { RemonlinePrivateApiClient } from '../remonline.private.api.mjs';

const cronTime = '0 * * * *'; // every hour at minute 0

export const refreshPrivateApiTokensJob = CronJob.from({
  cronTime,
  timeZone: 'Europe/Kiev',
  onTick: async () => {
    try {
      console.log('[RemonlinePrivateApi] Refresh tokens job started', {
        time: new Date().toISOString(),
      });

      const client = new RemonlinePrivateApiClient();
      const tokens = await client.refreshTokens();

      console.log('[RemonlinePrivateApi] Tokens refreshed successfully', {
        time: new Date().toISOString(),
        // Do not log actual tokens for security reasons
      });
    } catch (error) {
      console.error('[RemonlinePrivateApi] Error refreshing tokens', {
        time: new Date().toISOString(),
        error,
      });
    }
  },
});

