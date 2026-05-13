// Cron-обёртка: на каждом тике сначала тянем заказы (`loadOrders`),
// потом сразу подгружаем их позиции (`loadOrderItems`). Items работают по
// watermark из той же `entity_sync`, поэтому порядок важен — items должны
// идти после того, как orders обновили свой watermark.
import { CronJob } from 'cron';
import { loadOrders } from '../modules/load-orders.mjs';
import { loadOrderItems } from '../modules/load-order-items.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

const cronTime = '0 */4 * * *';
const timeZone = 'Europe/Kiev';
let isFunctionRunning = false;

async function runOrdersTick({ pageLimit } = {}) {
  if (isFunctionRunning) {
    console.log('loadOrdersJob: previous tick still running, skip');
    return;
  }

  try {
    isFunctionRunning = true;
    await loadOrders({ pageLimit });
    await loadOrderItems();
  } catch (error) {
    console.error('Error occurred in onTick loadOrdersJob');
    console.error({ time: new Date(), error });
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
