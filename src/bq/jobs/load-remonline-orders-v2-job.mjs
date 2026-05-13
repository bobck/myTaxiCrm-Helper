import { CronJob } from 'cron';
import {
  createOrResetOrdersV2Table,
  loadRemonlineOrdersV2,
} from '../modules/load-remonline-orders-v2.mjs';
import {
  createOrResetOrderItemsTable,
  loadRemonlineOrderItems,
} from '../modules/load-remonline-order-items.mjs';
import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';

const cronTime = '0 * * * *'; // Runs every hour
const timeZone = 'Europe/Kiev';

let isRunning = false;

async function runOrdersV2Tick() {
  if (isRunning) {
    console.log('loadRemonlineOrdersV2Job: previous tick still running, skip');
    return;
  }
  isRunning = true;
  try {
    await loadRemonlineOrdersV2();
    await loadRemonlineOrderItems();
  } catch (e) {
    console.error('An error occurred while uploading v2 orders');
    console.error(e);
  } finally {
    isRunning = false;
  }
}

const loadRemonlineOrdersV2Job = CronJob.from({
  cronTime,
  timeZone,
  onTick: runOrdersV2Tick,
});

export { loadRemonlineOrdersV2Job };

// if (process.env.ENV === 'TEST') {
//   console.log('running loadRemonlineOrdersV2Job tick once in TEST mode...');
//   await remonlineTokenToEnv(true);
//   // await createOrResetOrdersV2Table();
//   // await createOrResetOrderItemsTable();
//   await runOrdersV2Tick();
//   process.exit(0);
// }
