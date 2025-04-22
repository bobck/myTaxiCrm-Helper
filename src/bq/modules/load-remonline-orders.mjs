import {
  getOrderCount,
  getOrdersInRange,
  getOrdersByPageIds,
  getEmployees,
  postMockOrder,
} from '../../remonline/remonline.utils.mjs';
import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import {
  createOrResetTableByName,
  deleteRowsByOrderId,
  loadRowsViaJSONFile,
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
  getMaxOrderModifiedAt,
  synchronizeRemonlineOrders,
} from '../bq-queries.mjs';

function convertMs(t) {
  if (!t) {
    return null;
  }
  const MICROS_THRESHOLD = 1e11;

  if (t > MICROS_THRESHOLD) {
    return Math.floor(t / 1000);
  } else {
    return t * 1000;
  }
}
async function prepareOrders() {
  // const modified_at = Date.now() - 1000 * 60 * 60 * 24*30; // 10 hours
  const modified_at = convertMs(await getMaxOrderModifiedAt());

  // const modified_at = 1744882028000;
  const { orderCount } = await getOrderCount({ modified_at });
  // const orderCount = 20000;
  const startPage = 1;
  const requestsPerCall = 50;
  const ordersPerPage = 50;
  const pagesCount = Math.ceil(orderCount / ordersPerPage);
  // return
  const promises = [];
  console.log({
    modified_at,
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
    // console.log({message:'promise creation',props:{ modified_at, current_page, target_page }})
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
  // console.log('after promise all',orders.length, failedPages.length);
  let TTL = 10;
  console.log(
    `initial download finished with ${failedPages.length} failed pages.${failedPages.length ? `\nstarting to resolve failed pages...\ngiven TTL: ${TTL}` : ''}`
    // { failedPages }
  );
  while (TTL > 0 && failedPages.length > 0) {
    const { orders: temp_orders, failedPages: temp_failedPages } =
      await getOrdersByPageIds({ modified_at, pages: failedPages });
    orders.push(...temp_orders);
    // console.log('failed pages resolved (temp_orders)', temp_orders.length);
    // console.log('orders after failed pages resolved', orders.length);
    failedPages = structuredClone(temp_failedPages);
    TTL--;
  }
  console.log('all fails resolved with TTL:', TTL);

  const stat = orders.reduce((acc, curr) => {
    const { id } = curr;
    if (!acc.has(id)) {
      acc.set(id, 1);
    } else {
      acc.set(id, acc.get(id) + 1);
    }
    return acc;
  }, new Map());
  const duplicates = [...stat].filter(([key, value]) => value > 1);
  console.log(`duplicates: ${duplicates.length}`, duplicates);
  // const filteredOrders = orders.filter((item) => {

  // })
  return {
    orderCount,
    orders,
    failedPages,
  };
}

async function handleOrders({ orders }) {
  const employees = await getEmployees();
  const getEmployeeById = ({ id }) => {
    return employees.find((item) => item.id === id);
  };

  const handleOrderPartsOrOperations = ({ order_id, arr }) => {
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
        created_at: convertMs(item.created_at),
      };
      arr[index] = handledAttachment;
    });
  };

  const parsed_arrays = orders.reduce(
    (acc, curr, index) => {
      const order_creator = getEmployeeById({ id: curr.created_by_id });
      const created_by = `${order_creator.first_name} ${order_creator.last_name}`;
      const ad_campaign = structuredClone(curr.ad_campaign);
      const order = {
        ...structuredClone(curr),
        client_id: curr.client.id,
        created_by,
        asset_id: curr.asset.id,
        modified_at: convertMs(curr.modified_at),
        created_at: convertMs(curr.created_at),
        done_at: convertMs(curr.done_at),
        scheduled_for: convertMs(curr.scheduled_for),
        warranty_date: convertMs(curr.warranty_date),
        closed_at: convertMs(curr.closed_at),
        estimated_done_at: convertMs(curr.estimated_done_at),
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
      delete order.order_type;
      delete order.operations;
      delete order.attachments;
      delete order.resources;

      // order

      handleOrderPartsOrOperations({ order_id, arr: parts });
      handleOrderPartsOrOperations({ order_id, arr: operations });
      handleAttachments({ order_id, arr: attachments });

      acc.handledOrders.push(order);
      acc.handledOrderParts.push(...parts);
      acc.handledOrderOperations.push(...operations);
      acc.handledOrderAttachments.push(...attachments);

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
  return parsed_arrays;
}

async function clearOrdersInBQ({ handledOrders }) {
  const order_ids = handledOrders.map((order) => order.id);
  const table_ids = [
    'orders',
    'order_operations',
    'order_attachments',
    'order_parts',
    'orders_to_resources',
  ];
  try {
    const promises = [];
    for (const table_id of table_ids) {
      promises.push(deleteRowsByOrderId({ order_ids, table_id }));
    }
    await Promise.all(promises);
  } catch (error) {
    console.error(error);
  }
}
async function loadOrdersToBQ({
  handledOrders,
  handledOrderParts,
  handledOrderOperations,
  handledOrderAttachments,
  handledOrderResources,
  orders2Resources,
  handledCampaigns,
}) {
  try {
    const dataset_id = 'RemOnline';
    const jobs = [
      {
        dataset_id,
        table_id: 'orders',
        rows: handledOrders,
        schema: ordersTableSchema,
      },
      {
        dataset_id,
        table_id: 'order_parts',
        rows: handledOrderParts,
        schema: orderPartsTableSchema,
      },
      {
        dataset_id,
        table_id: 'order_operations',
        rows: handledOrderOperations,
        schema: orderOperationsTableSchema,
      },
      {
        dataset_id,
        table_id: 'order_attachments',
        rows: handledOrderAttachments,
        schema: orderAttachmentsTableSchema,
      },
      {
        dataset_id,
        table_id: 'order_resources',
        rows: handledOrderResources,
        schema: orderResourcesTableSchema,
      },
      {
        dataset_id,
        table_id: 'orders_to_resources',
        rows: orders2Resources,
        schema: orders2ResourcesTableSchema,
      },
      {
        dataset_id,
        table_id: 'campaigns',
        rows: handledCampaigns,
        schema: campaignsTableSchema,
      },
    ];

    const promises = jobs.map((job) => {
      const { dataset_id, table_id, rows, schema } = job;
      return loadRowsViaJSONFile({
        dataset_id,
        table_id,
        rows,
        schema,
      });
    })
    await Promise.all(promises);
    // console.log(responses);
  } catch (e) {
    // e.errors.forEach((error) => {
    //   if (error.errors) {
    //     console.log('top module error');
    //     if (error.errors[0].message !== '') {
    //       console.error(error);
    //     }
    //   }
    //   console.log(error);
    // });
    console.error(e);
  }
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

  // return;
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
  if (handledOrders.length === 0) {
    return;
  }
  const time3 = new Date();
  console.log({ reducingTime: time3 - time2 });

  console.log('clearing orders in BQ...');
  await clearOrdersInBQ({ handledOrders });
  const time4 = new Date();
  console.log({ clearingTime: time4 - time3 });
  console.log(`inserting orders to BQ...`);
  await loadOrdersToBQ({
    handledOrders,
    handledOrderParts,
    handledOrderOperations,
    handledOrderAttachments,
    handledOrderResources,
    orders2Resources,
    handledCampaigns,
  });

  const time5 = new Date();
  console.log({ bqLoadingTime: time5 - time4 });
  console.log('synchronizing orders in local DB...');
  await synchronizeRemonlineOrders({
    orders: handledOrders,
  });
  const time6 = new Date();
  console.log({ localDBLoadingTime: time6 - time5 });
  console.log(handledOrders)
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
  // const a = await postMockOrder();

  // const b = await postMockOrder();

  // const c = await postMockOrder();
  // console.log(a, b, c);
  // await createOrResetOrdersTables();
}
