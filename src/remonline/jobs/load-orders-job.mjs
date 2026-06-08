import { CronJob } from 'cron';
import { loadOrders } from '../modules/load-orders.mjs';
import { loadOrderItems } from '../modules/load-order-items.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

const cronTime = '0 */1 * * *';
const timeZone = 'Europe/Kiev';
let isFunctionRunning = false;

async function runOrdersTick({ pageLimit } = {}) {
  if (isFunctionRunning) {
    console.log('loadOrdersJob: previous tick still running, skip');
    return;
  }

  try {
    isFunctionRunning = true;
    try {
      await loadOrders({ pageLimit });
    } catch (error) {
      console.error({ time: new Date(), module: 'loadOrders', error });
      throw error;
    }
    try {
      await loadOrderItems();
    } catch (error) {
      console.error({ time: new Date(), module: 'loadOrderItems', error });
      throw error;
    }
  } catch {
    // already logged by inner handler
  } finally {
    isFunctionRunning = false;
  }
}

const loadOrdersJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: runOrdersTick,
});

export { loadOrdersJob };

if (process.env.ENV === 'TEST') {
  console.log('Running loadOrdersJob tick once in TEST mode (pageLimit=3)...');
  await remonlineTokenToEnv(true);
  await runOrdersTick({ pageLimit: 2 });
  process.exit(0);
}
