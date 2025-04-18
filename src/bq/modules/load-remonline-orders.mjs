import {
  getOrders,
  getOrderCount,
  getOrdersInRange,
  getOrdersByPageIds,
  getEmployees,
  getOrdersByLastModificationDate,
} from '../../remonline/remonline.utils.mjs';
import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import {
  createOrResetTableByName,
  insertRowsAsStream,
  clearOrdersByIds,
} from '../bq-utils.mjs';
import {
  ordersTableSchema,
  orderPartsTableSchema,
  orderOperationsTableSchema,
  orderAttachmentsTableSchema,
  orders2ResourcesTableSchema,
  orderResourcesTableSchema,
  campaignsTableSchema,
} from '../schemas.mjs';
import {
  createMultipleRemonlineOrders,
  deleteMultipleRemonlineOrders,
  getMaxOrderModifiedAt,
} from '../bq-queries.mjs';

function convertMsUs(t) {
  // threshold somewhere between 1e13 and 1e14
  const MICROS_THRESHOLD = 1e11;
  // console.log(
  //   `t: ${t} > MICROS_THRESHOLD: ${MICROS_THRESHOLD} : ${t > MICROS_THRESHOLD}`
  // );
  if (t > MICROS_THRESHOLD) {
    // probably µs: bring it back to ms
    return Math.floor(t / 1000);
  } else {
    // probably ms: convert to µs
    return t * 1000;
  }
}
async function prepareOrders() {
  // const modified_at = Date.now() - 1000 * 60 * 60 * 24;
  const modified_at = convertMsUs(await getMaxOrderModifiedAt());
  // const modified_at = 1744917651000;
  const { orderCount } = await getOrderCount({ modified_at });
  // const orderCount = 20000;
  const startPage = 1;
  const requestsPerCall = 5;
  const ordersPerPage = 50;
  const pagesCount = Math.ceil(orderCount / ordersPerPage);
  // return
  const promises = [];
  console.log({
    orderCount,
    requestsPerCall,
    startPage,
    pagesCount,
    ordersPerPage,
  });
  // return;
  console.log('downloading orders...');
  for (let i = startPage; i <= pagesCount; i += requestsPerCall + 1) {
    const current_page = i;
    const target_page_pretendent = i + requestsPerCall;
    const target_page =
      target_page_pretendent > pagesCount ? pagesCount : target_page_pretendent;
    promises.push(getOrdersInRange({ modified_at, current_page, target_page }));
    // console.log('fetching started', { current_page, target_page });
  }
  console.log(
    `orders downloading has been initiated in ${promises.length} parallel threads...`
  );
  const results = await Promise.all(promises);

  console.log('orders downloading has been finished');
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
      await getOrdersByPageIds({ modified_at, pages: failedPages });
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

async function prepareOrdersSync() {
  const { orderCount } = await getOrderCount();
  const { orders, failedPages } = await getOrders();
  return { orders, orderCount, failedPages };
}
async function handleOrders({ orders }) {
  const employees = await getEmployees();
  const getEmployeeById = ({ id }) => {
    return employees.find((item) => item.id === id);
  };

  const handleOrderParts = ({ order_id, arr }) => {
    arr.forEach((item, index) => {
      const handledItem = {
        order_id,
        ...item,
        entity_id: item.entityId,
        engineer_id: item.engineerId,
        uom_id: item.uom.id,
      };
      delete handledItem.entityId;
      delete handledItem.engineerId;
      delete handledItem.taxes;
      delete handledItem.uom;
      arr[index] = handledItem;
    });
  };
  const handleOrderOperations = ({ order_id, arr }) => {
    arr.forEach((item, index) => {
      const handledItem = {
        order_id,
        ...item,
        entity_id: item.entityId,
        engineer_id: item.engineerId,
        uom_id: item.uom.id,
      };

      delete handledItem.entityId;
      delete handledItem.engineerId;
      delete handledItem.taxes;
      delete handledItem.uom;
      arr[index] = handledItem;
    });
  };

  const handleAttachments = ({ order_id, arr }) => {
    arr.forEach((item, index) => {
      const handledAttachment = {
        ...item,
        order_id,
        created_at: convertMsUs(item.created_at),
      };
      arr[index] = handledAttachment;
    });
  };
  // const assignOrderId = ({ order_id, arr }) => {
  //   arr.forEach((item) => ({ order_id, ...item }));
  // };

  return orders.reduce(
    (acc, curr, index) => {
      const order_creator = getEmployeeById({ id: curr.created_by_id });
      const created_by = `${order_creator.first_name} ${order_creator.last_name}`;
      const ad_campaign = structuredClone(curr.ad_campaign);
      const order = {
        ...structuredClone(curr),
        client_id: curr.client.id,
        created_by,
        asset_id: curr.asset.id,
        modified_at: convertMsUs(curr.modified_at),
        created_at: convertMsUs(curr.created_at),
        done_at: convertMsUs(curr.done_at),
        scheduled_for: convertMsUs(curr.scheduled_for),
        warranty_date: convertMsUs(curr.warranty_date),
        closed_at: convertMsUs(curr.closed_at),
        estimated_done_at: convertMsUs(curr.estimated_done_at),
        custom_fields: JSON.stringify(curr.custom_fields),
        // ...curr.custom_fields,
        order_type_id: curr.order_type.id,
        status_id: curr.status.id,
      };
      //compaign handling
      const hasCampaign =
        typeof ad_campaign === 'object' &&
        ad_campaign !== null &&
        Object.keys(ad_campaign).length > 0;
      if (hasCampaign) {
        order.ad_campaign_id = ad_campaign.id;
        if (!acc.handledCampaigns.some((i) => i.id === order.ad_campaign.id)) {
          acc.handledCampaigns.push(ad_campaign);
        }
      }
      delete order.ad_campaign;

      const { id: order_id } = order;

      const parts = structuredClone(curr.parts);
      const operations = structuredClone(curr.operations);
      const attachments = structuredClone(curr.attachments);
      const resources = structuredClone(curr.resources);

      delete order.parts;
      delete order.client;
      delete order.status;
      delete order.resources;
      delete order.asset;
      // delete order.custom_fields;
      delete order.order_type;
      delete order.operations;
      delete order.attachments;
      delete order.resources;

      // order

      handleOrderParts({ order_id, arr: parts });
      handleOrderOperations({ order_id, arr: operations });
      handleAttachments({ order_id, arr: attachments });

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

      resources.forEach((item) => {
        acc.orders2Resources.push({ resource_id: item.id, order_id });
        const doesExist = acc.handledOrderResources.some(
          (i) => i.id === item.id
        );
        if (!doesExist) {
          acc.handledOrderResources.push(item);
        }
      });

      return acc;
    },
    {
      handledOrders: [],
      handledOrderParts: [],
      handledOrderOperations: [],
      handledOrderAttachments: [],
      handledOrderResources: [],
      orders2Resources: [],
      handledCampaigns: [],
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
  // const { orderCount, orders, failedPages } = await prepareOrdersSync();
  console.log({
    time,
    message: 'loadRemonlineOrders',
    expectedOrdersCount: orderCount,
    ordersCount: orders.length,
    failedPages: failedPages.length,
  });
  const time2 = new Date();
  console.log({ downloadingTime: time2 - time });
  console.log(`parsing orders...`);
  const {
    handledOrders,
    handledOrderParts,
    handledOrderOperations,
    handledOrderAttachments,
    handledOrderResources,
    orders2Resources,
    handledCampaigns,
  } = await handleOrders({ orders });
  console.log({
    handledOrders: handledOrders.length,
    handledOrderParts: handledOrderParts.length,
    handledOrderOperations: handledOrderOperations.length,
    handledOrderAttachments: handledOrderAttachments.length,
    orders2Resources: orders2Resources.length,
    handledOrderResources: handledOrderResources.length,
    handledCampaigns: handledCampaigns.length,
  });
  const time3 = new Date();
  // console.log(handledOrderParts.find((item) => item.taxes.length > 0));

  // console.log({
  //   handledOrders: handledOrders[0],
  //   handledOrderParts: handledOrderParts[0],
  //   handledOrderOperations: handledOrderOperations[0],
  //   handledOrderAttachments: handledOrderAttachments[0],
  //   orders2Resources: orders2Resources[0],
  //   handledOrderResources: handledOrderResources[0],
  //   handledCampaigns: handledCampaigns[0],
  // });
  console.log({ reducingTime: time3 - time2 });
  // const stat = handledOrders.reduce((acc, curr) => {
  //   for (const key in curr) {
  //     if (acc.has(key)) {
  //       const a = acc.get(key);
  //       acc.set(key, { ...a, qty: a.qty + 1 });
  //     } else {
  //       acc.set(key, { qty: 1, example: curr[key] });
  //     }
  //   }

  //   return acc;
  // }, new Map());
  // // console.log(stat, stat.size);
  // console.log(`updating orders to local DB...`);
  // await deleteMultipleRemonlineOrders({ orders: handledOrders });
  // await createMultipleRemonlineOrders({ orders: handledOrders });
  // const lastModifiedAt = await getMaxOrderModifiedAt();
  // console.log({ lastModifiedAt });
  const time4 = new Date();
  console.log({ localDBLoadingTime: time4 - time3 });

  console.log(`inserting orders to BQ...`);
  try {
    await insertRowsAsStream({
      dataset_id: 'RemOnline',
      rows: handledOrders,
      bqTableId: 'orders',
    });
    // await clearOrdersByIds({
    //   bqTableId: 'orders',
    //   ids: handledOrders.map((item) => item.id),
    // });
    await insertRowsAsStream({
      dataset_id: 'RemOnline',
      rows: handledOrderParts,
      bqTableId: 'order_parts',
    });
    await insertRowsAsStream({
      dataset_id: 'RemOnline',
      rows: handledOrderOperations,
      bqTableId: 'order_operations',
    });
    await insertRowsAsStream({
      dataset_id: 'RemOnline',
      rows: handledOrderAttachments,
      bqTableId: 'order_attachments',
    });
    await insertRowsAsStream({
      dataset_id: 'RemOnline',
      rows: orders2Resources,
      bqTableId: 'orders_to_resources',
    });
    await insertRowsAsStream({
      dataset_id: 'RemOnline',
      rows: handledOrderResources,
      bqTableId: 'order_resources',
    });
    await insertRowsAsStream({
      dataset_id: 'RemOnline',
      rows: handledCampaigns,
      bqTableId: 'campaigns',
    });
  } catch (e) {
    e.errors.forEach((error) => {
      if (error.errors) {
        if (error.errors[0].message !== '') {
          console.error(error);
        }
      }
      // console.log(error)
    });
  }
  const time5 = new Date();
  console.log({ bqLoadingTime: time5 - time4 });
}
async function createOrResetOrdersTables() {
  await createOrResetTableByName({
    bqTableId: 'orders',
    schema: ordersTableSchema,
    dataSetId: 'RemOnline',
  });
  await createOrResetTableByName({
    bqTableId: 'order_parts',
    schema: orderPartsTableSchema,
    dataSetId: 'RemOnline',
  });
  await createOrResetTableByName({
    bqTableId: 'order_operations',
    schema: orderOperationsTableSchema,
    dataSetId: 'RemOnline',
  });
  await createOrResetTableByName({
    bqTableId: 'order_attachments',
    schema: orderAttachmentsTableSchema,
    dataSetId: 'RemOnline',
  });
  await createOrResetTableByName({
    bqTableId: 'orders_to_resources',
    schema: orders2ResourcesTableSchema,
    dataSetId: 'RemOnline',
  });
  await createOrResetTableByName({
    bqTableId: 'order_resources',
    schema: orderResourcesTableSchema,
    dataSetId: 'RemOnline',
  });
  await createOrResetTableByName({
    bqTableId: 'campaigns',
    schema: campaignsTableSchema,
    dataSetId: 'RemOnline',
  });
}
if (process.env.ENV === 'TEST') {
  console.log(`running loadRemonlineOrders in Test mode...`);
  await remonlineTokenToEnv(true);

  await loadRemonlineOrders();
  // await createOrResetOrdersTables();
}
// 1744917651000
