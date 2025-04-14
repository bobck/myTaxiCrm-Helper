import { getOrders, getOrderCount, getOrdersByPageIds } from '../../remonline/remonline.utils.mjs';
import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
async function prepareOrders() {
  const { orderCount } = await getOrderCount();
  // const orderCount = 20000;
  const requestsPerCall = 5;
  const ordersPerPage = 50;
  const pagesCount = Math.ceil(orderCount / ordersPerPage);
  const promises = [];
  console.log({ orderCount, requestsPerCall, pagesCount, ordersPerPage });
  console.log('downloading orders...');
  for (let i = 1; i <= pagesCount; i += requestsPerCall + 1) {
    const current_page = i;
    const target_page_pretendent = i + requestsPerCall;
    const target_page =
      target_page_pretendent > pagesCount ? pagesCount : target_page_pretendent;
    promises.push(getOrders({ current_page, target_page }));
    console.log('fetching started', { current_page, target_page });
  }
  const results = await Promise.all(promises);
  // const orders = results.flat();
  const { _orders, _failedPages } = results.reduce(
    (acc, curr) => {
      acc._orders.push(curr.orders);
      acc._failedPages.push(curr.failedPages);
      return acc;
    },
    { _orders: [], _failedPages: [] }
  );

  const orders = _orders.flat();
  const failedPages = _failedPages.flat();
  console.log({failedQty: failedPages.length});
  const {orders:orders2,failedPages:FailedPages} = await getOrdersByPageIds({pages:failedPages});
  console.log({orders2Length: orders2.length,failedPages:FailedPages,failedQty:FailedPages.length});

  return {
    // orders,
    results,
    orderCount,
    orders,
    failedPages,
  };
}
export async function loadRemonlineOrders() {
  /**
   * Average time to load 50 orders is 0.7 sec,
   * Remonline API has around 113K orders,
   * via one request we can get 50 orders
   * 113000 / 50 = 2260 pages
   * 2260 * 0.7 = 1582 sec
   * 1582 sec = 26.3 min
   * so we need to load orders in parallel
   *
   * We can load 10 pages in parallel
   *
   */
  const time = new Date();
  const { orderCount, results, orders, failedPages } = await prepareOrders();
  console.log({
    time,
    message: 'loadRemonlineOrders',
    expectedOrdersCount: orderCount,
    ordersCount: orders.length,
    failedPages: failedPages.length,
  });
  console.log(failedPages);
  console.log({ downloadingTime: new Date() - time });

  //   const {orders} = await getOrders({current_page:10,_orders:[]});
  //   if (orders.length === 0) {
  //     return;
  //   }
  //   console.log(orders[0]);
}

if (process.env.ENV === 'TEST') {
  console.log(`running loadRemonlineOrders in Test mode...`);
  await remonlineTokenToEnv(true);
  await loadRemonlineOrders();
}
