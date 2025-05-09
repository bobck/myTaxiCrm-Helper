import { CronJob } from 'cron';
import { getAndSaveClosedPolishBitrixDeals } from '../modules/get-and-save-closed-polish-bitrix-deals.mjs';

const cronTime = '25 0 * * *';

const timeZone = 'Europe/Kiev';

const getAndSaveClosedPolishBitrixDealsJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    try {
      await getAndSaveClosedPolishBitrixDeals();
    } catch (error) {
      console.error(
        'Error occurred in onTick getAndSaveClosedPolishBitrixDeals'
      );
      console.error({ time: new Date(), error });
    }
  },
});

export { getAndSaveClosedPolishBitrixDealsJob };
