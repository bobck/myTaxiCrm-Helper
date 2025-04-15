import {
  getOrders,
  getOrderCount,
  getOrdersByPageIds,
} from '../../remonline/remonline.utils.mjs';
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
    // console.log('fetching started', { current_page, target_page });
  }
  console.log(
    `orders downloading has been initiated in ${promises.length} parallel threads...`
  );
  const results = await Promise.all(promises);
  // const orders = results.flat();
  let { orders, failedPages } = results.reduce(
    (acc, curr) => {
      acc.orders.push(...curr.orders);
      acc.failedPages.push(...curr.failedPages);
      return acc;
    },
    { orders: [], failedPages: [] }
  );
  let TTL = 10;
  console.log(
    `initial download finished with ${failedPages.length} failed pages.${failedPages.length ? `\nstarting to resolve failed pages...\ngiven TTL: ${TTL}` : ''}`
  );
  do {
    const { orders: tem_orders, failedPages: temp_failedPages } =
      await getOrdersByPageIds({ pages: failedPages });
    orders.push(...tem_orders);
    failedPages = structuredClone(temp_failedPages);
  } while (TTL-- > 0 && failedPages.length > 0);
  console.log('all fails resolved with TTL:', TTL);
  return {
    orderCount,
    orders,
    failedPages,
  };
}
async function handleOrders({ orders }) {
  const assignOrderId = ({ order_id, arr }) => {
    arr.forEach((item, index) => (arr[index] = { order_id, ...item }));
  };

  return orders.reduce(
    (acc, curr, index) => {
      console.log(`parsing(${index}), date now:${Date.now()}`);
      const order = {
        ...structuredClone(curr),
        client_id: curr.client.id,
        asset_id: curr.asset.id,
        ...curr.custom_fields,
        order_type_id: curr.order_type.id,
        status_id: curr.status.id,
      };

      const { id: order_id } = order;

      const parts = structuredClone(curr.parts);
      const operations = structuredClone(curr.operations);
      const attachments = structuredClone(curr.attachments);

      delete order.parts;
      delete order.client;
      delete order.status;
      delete order.resources;
      delete order.asset;
      delete order.custom_fields;
      delete order.order_type;
      delete order.operations;
      delete order.attachments;

      // order

      assignOrderId({ order_id, arr: parts });
      assignOrderId({ order_id, arr: operations });
      assignOrderId({ order_id, arr: attachments });

      acc.handledOrders = [...acc.handledOrders, order];
      acc.handledOrderParts = [...acc.handledOrderParts, ...parts];
      acc.handledOrderOperations = [
        ...acc.handledOrderOperations,
        ...operations,
      ];
      acc.handledOrderAttachments = [
        ...acc.handledOrderAttachments,
        ...attachments,
      ];

      return acc;
    },
    {
      handledOrders: [],
      handledOrderParts: [],
      handledOrderOperations: [],
      handledOrderAttachments: [],
    }
  );
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
   */
  const time = new Date();
  const { orderCount, orders, failedPages } = await prepareOrders();
  console.log({
    time,
    message: 'loadRemonlineOrders',
    expectedOrdersCount: orderCount,
    ordersCount: orders.length,
    failedPages: failedPages.length,
  });
  const time2 = new Date();
  console.log({ downloadingTime: time2 - time });
  const {
    handledOrders,
    handledOrderParts,
    handledOrderOperations,
    handledOrderAttachments,
  } = await handleOrders({ orders });
  console.log({
    handledOrders: handledOrders.length,
    handledOrderParts: handledOrderParts.length,
    handledOrderOperations: handledOrderOperations.length,
    handledOrderAttachments: handledOrderAttachments.length,
  });
  const time3 = new Date();
  // console.log({
  //   handledOrders: handledOrders[0],
  //   handledOrderParts: handledOrderParts[0],
  //   handledOrderOperations: handledOrderOperations[0],
  //   handledOrderAttachments: handledOrderAttachments[0],
  // });

  console.log({
    handledOrdersWithoutAd_Campaign: handledOrders.reduce(
      (acc, curr) => {
        if ((
          curr.ad_campaign &&
          typeof curr.ad_campaign === 'object' &&
          Object.keys(curr.ad_campaign).length > 0
        )) {
          acc.qty += 1;
          acc.orderIds.push(curr.order_id);
        }
        return acc;
      },
      { qty: 0, orderIds: [] }
    ),
  });

  console.log({ reducingTime: time3 - time2 });
}

if (process.env.ENV === 'TEST') {
  console.log(`running loadRemonlineOrders in Test mode...`);
  await remonlineTokenToEnv(true);
  await loadRemonlineOrders();
}
