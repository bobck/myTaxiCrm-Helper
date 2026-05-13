// Cron-обёртка: на каждом тике сначала тянем заказы (`loadOrders`),
// потом сразу подгружаем их позиции (`loadOrderItems`). Items работают по
// watermark из той же `entity_sync`, поэтому порядок важен — items должны
// идти после того, как orders обновили свой watermark.
import { CronJob } from 'cron';
import { loadOrders } from '../modules/load-orders.mjs';
import { loadOrderItems } from '../modules/load-order-items.mjs';

const cronTime = '0 */4 * * *';
const timeZone = 'Europe/Kiev';
let isFunctionRunning = false;

const loadOrdersJob = CronJob.from({
  cronTime,
  timeZone,
  onTick: async () => {
    if (isFunctionRunning) {
      console.log('loadOrdersJob: previous tick still running, skip');
      return;
    }

    try {
      isFunctionRunning = true;
      await loadOrders();
      await loadOrderItems();
    } catch (error) {
      console.error('Error occurred in onTick loadOrdersJob');
      console.error({ time: new Date(), error });
    } finally {
      isFunctionRunning = false;
    }
  },
});

export { loadOrdersJob };
