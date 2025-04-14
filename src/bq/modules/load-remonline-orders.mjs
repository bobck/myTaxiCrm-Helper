import{getOrders} from '../../remonline/remonline.utils.mjs'
import{remonlineTokenToEnv} from '../../remonline/remonline.api.mjs'

export async function loadRemonlineOrders() {
  const {orders} = await getOrders();
  console.log({
    time: new Date(),
    message: 'loadRemonlineOrders',
    orders: orders.length,
  });
  if (orders.length === 0) {
    return;
  }
  console.log(orders[0]);
}

if (process.env.ENV === 'TEST') {
  await remonlineTokenToEnv();
  loadRemonlineOrders();
}
