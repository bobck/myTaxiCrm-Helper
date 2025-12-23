import { getOrders } from '../../remonline/remonline.utils.mjs';
import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import {
  createOrResetTableByName,
  deleteRowsByParameter,
  loadRowsViaJSONFile,
} from '../bq-utils.mjs';
import {
  ordersTableSchema,
  orderPartsTableSchema,
  orderOperationsTableSchema,
  orderAttachmentsTableSchema,
  orders2ResourcesTableSchema,
  orderResourcesTableSchema,
} from '../schemas.mjs';
import {
  getMaxOrderModifiedAt,
  synchronizeRemonlineOrders,
  getAllResourceIds,
  insertOrderResourcesBatch,
} from '../bq-queries.mjs';
import { loadRemonlineOrderProductPricesToBQ1Thread } from './load-remonline-order-product-prices.mjs';

async function prepareOrderSequentially() {
  const modified_at = await getMaxOrderModifiedAt();
  const sort_dir = 'asc';
  const { orders, count } = await getOrders({ modified_at, sort_dir });
  return { orders, orderCount: count, modified_at };
}

async function parseOrdersToSeparateTables({ orders }) {
  const existingResourceIds = await getAllResourceIds();
  // const existingCampaignIds = await getAllCampaignIds();

  const filterResourcesOrCampaigns = ({ arr, existingIds }) => {
    const filtered = arr.filter((item) => {
      const { id } = item;
      return !existingIds.includes(id);
    });
    return filtered;
  };
  // mapper for parts and operations
  const mapRemonlineOrderParts = ({ order_id, parts }) => {
    return parts.map((part, index) => {
      const {
        id,
        title,
        amount,
        price,
        cost,
        discount_value,
        code,
        article,
        warranty,
        warranty_period,
        entityId,
        engineerId,
        uom,
      } = part;
      const handledPart = {
        order_id,
        id,
        title,
        amount,
        price,
        cost,
        discount_value,
        code,
        article,
        warranty,
        warranty_period,
        entity_id: entityId,
        engineer_id: engineerId,
        uom_id: uom.id,
      };
      return handledPart;
    });
  };

  const mapRemonlineOrderOperations = ({ order_id, operations }) => {
    // Use map to create a new array with transformed operation objects
    return operations.map((operation) => {
      const {
        id,
        title,
        amount,
        price,
        cost,
        discount_value,
        warranty,
        warranty_period,
        entityId,
        engineerId,
        uom,
      } = operation;
      const handledOperation = {
        order_id,
        id,
        title,
        amount,
        price,
        cost,
        discount_value,
        warranty,
        warranty_period,
        entity_id: entityId,
        engineer_id: engineerId,
        uom_id: uom?.id,
      };
      return handledOperation;
    });
  };

  const mapRemonlineOrderAttachments = ({ order_id, attachments }) => {
    return attachments.map((attachment) => {
      const { created_at, created_by_id, filename, url } = attachment;
      const handledAttachment = {
        order_id,
        created_at,
        created_by_id,
        filename,
        url,
      };
      return handledAttachment;
    });
  };

  const parsed_arrays = orders.reduce(
    (acc, curr_order, index) => {
      const {
        id,
        uuid,
        created_at,
        warranty_date,
        scheduled_for,
        modified_at,
        duration,
        kindof_good,
        serial,
        packagelist,
        appearance,
        malfunction,
        manager_notes,
        engineer_notes,
        resume,
        payed,
        missed_payments,
        warranty_measures,
        urgent,
        discount_sum,
        estimated_cost,
        id_label,
        price,
        branch_id,
        overdue,
        status_overdue,
        manager_id,
        engineer_id,
        created_by_id,
        closed_by_id,
        brand,
        model,
        closed_at,
        estimated_done_at,
        done_at,
        // Fields previously mentioned as deleted, now included in destructuring
        parts,
        client,
        status,
        resources,
        asset,
        order_type,
        operations,
        attachments,
        ad_campaign,
      } = curr_order;
      const client_id = client.id;
      const client_name =
        client?.name || `${client?.first_name} ${client?.last_name}`;
      const asset_id = asset?.id;
      const custom_fields = JSON.stringify({
        ...curr_order.custom_fields,
        f3369990: asset?.f3369990, //historical millage handling
        f3369991: asset?.f3369991,
      });
      const order_type_id = order_type.id;
      const status_id = status.id;
      const asset_uid = asset?.uid;

      const handled_order = {
        id,
        uuid,
        duration,
        kindof_good,
        serial,
        packagelist,
        appearance,
        malfunction,
        manager_notes,
        engineer_notes,
        created_at,
        warranty_date,
        scheduled_for,
        modified_at,
        resume,
        payed,
        missed_payments,
        warranty_measures,
        urgent,
        discount_sum,
        estimated_cost,
        id_label,
        price,
        closed_at,
        estimated_done_at,
        done_at,
        branch_id,
        overdue,
        status_overdue,
        manager_id,
        engineer_id,
        created_by_id,
        closed_by_id,
        brand,
        model,
        client_name,
        client_id,
        asset_id,
        custom_fields,
        order_type_id,
        status_id,
        asset_uid,
      };
      //campaign handling
      const hasCampaign =
        typeof ad_campaign === 'object' &&
        ad_campaign !== null &&
        Object.keys(ad_campaign).length > 0;
      if (hasCampaign) {
        handled_order.ad_campaign_id = ad_campaign.id;
        // if (
        //   !acc.handledCampaigns.some((i) => i.id === order_clone.ad_campaign.id)
        // ) {
        //   acc.handledCampaigns.push(ad_campaign);
        // }
      }

      const { id: order_id } = handled_order;

      const handledParts = mapRemonlineOrderParts({ order_id, parts });
      const handledOperations = mapRemonlineOrderOperations({
        order_id,
        operations,
      });
      const handledAttachments = mapRemonlineOrderAttachments({
        order_id,
        attachments,
      });

      acc.handledOrders.push(handled_order);
      acc.handledOrderParts.push(...handledParts);
      acc.handledOrderOperations.push(...handledOperations);
      acc.handledOrderAttachments.push(...handledAttachments);

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
      // handledCampaigns: [],
    }
  );
  const {
    handledOrders,
    handledOrderParts,
    handledOrderOperations,
    handledOrderAttachments,
    handledOrderResources,
    orders2Resources,
    // handledCampaigns,
  } = parsed_arrays;

  //filtering resources and campaigns because they are common for many orders
  const resources = filterResourcesOrCampaigns({
    arr: handledOrderResources,
    existingIds: existingResourceIds,
  });
  // const campaigns = filterResourcesOrCampaigns({
  //   arr: handledCampaigns,
  //   existingIds: existingCampaignIds,
  // });

  return {
    handledOrders,
    handledOrderParts,
    handledOrderOperations,
    handledOrderAttachments,
    handledOrderResources: resources,
    orders2Resources,
    // handledCampaigns: campaigns,
  };
}

async function clearOrdersInBQ({ handledOrders }) {
  const order_ids = handledOrders.map((order) => order.id);
  const dataset_id = 'RemOnline';
  const table_ids = [
    'orders',
    'orders_operations',
    'orders_attachments',
    'orders_parts',
    'orders_to_resources',
    'product_prices',
  ];

  const promises = [];
  for (const table_id of table_ids) {
    promises.push(
      deleteRowsByParameter({
        arrayToDelete: order_ids,
        parameter: table_id === 'orders' ? 'id' : 'order_id',
        table_id,
        dataset_id,
      })
    );
  }
  const results = await Promise.allSettled(promises);
  const failedTablesInfo = results.filter(
    (result) => result.status === 'rejected'
  );
  if (failedTablesInfo.length > 0) {
    throw failedTablesInfo;
  }
}
async function loadOrdersToBQ({
  handledOrders,
  handledOrderParts,
  handledOrderOperations,
  handledOrderAttachments,
  handledOrderResources,
  orders2Resources,
  // handledCampaigns,
}) {
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
      table_id: 'orders_parts',
      rows: handledOrderParts,
      schema: orderPartsTableSchema,
    },
    {
      dataset_id,
      table_id: 'orders_operations',
      rows: handledOrderOperations,
      schema: orderOperationsTableSchema,
    },
    {
      dataset_id,
      table_id: 'orders_attachments',
      rows: handledOrderAttachments,
      schema: orderAttachmentsTableSchema,
    },
    {
      dataset_id,
      table_id: 'orders_resources',
      rows: handledOrderResources,
      schema: orderResourcesTableSchema,
    },
    {
      dataset_id,
      table_id: 'orders_to_resources',
      rows: orders2Resources,
      schema: orders2ResourcesTableSchema,
    },
    // {
    //   dataset_id,
    //   table_id: 'orders_campaigns',
    //   rows: handledCampaigns,
    //   schema: campaignsTableSchema,
    // },
  ];

  const promises = jobs.map((job) => {
    const { dataset_id, table_id, rows, schema } = job;
    return loadRowsViaJSONFile({
      dataset_id,
      table_id,
      rows,
      schema,
    });
  });
  const results = await Promise.allSettled(promises);
  const failedTablesInfo = results.filter(
    (result) => result.status === 'rejected'
  );
  if (failedTablesInfo.length > 0) {
    throw failedTablesInfo;
  }
}
export async function loadRemonlineOrders() {
  const time = new Date();
  const { orderCount, orders, modified_at } = await prepareOrderSequentially();
  console.log({
    time,
    message: 'loadRemonlineOrders',
    expectedOrdersCount: orderCount,
    ordersCount: orders.length,
    modified_at,
  });
  if (orders.length === 0) {
    return;
  }
  const {
    handledOrders,
    handledOrderParts,
    handledOrderOperations,
    handledOrderAttachments,
    handledOrderResources,
    orders2Resources,
    // handledCampaigns,
  } = await parseOrdersToSeparateTables({ orders });

  try {
    await clearOrdersInBQ({ handledOrders });
    await loadOrdersToBQ({
      handledOrders,
      handledOrderParts,
      handledOrderOperations,
      handledOrderAttachments,
      handledOrderResources,
      orders2Resources,
      // handledCampaigns,
    });
    const order_ids = handledOrders.map((order) => {
      return { order_id: order.id };
    });
    return { order_ids };
  } catch (errors) {
    for (const err of errors) {
      const { reason } = err;
      console.error({ status: err.status, reason });
    }
    return;
  }
}
async function createOrResetOrdersTables() {
  await createOrResetTableByName({
    bqTableId: 'orders',
    schema: ordersTableSchema,
    dataSetId: 'RemOnline',
  });
  await createOrResetTableByName({
    bqTableId: 'orders_parts',
    schema: orderPartsTableSchema,
    dataSetId: 'RemOnline',
  });
  await createOrResetTableByName({
    bqTableId: 'orders_operations',
    schema: orderOperationsTableSchema,
    dataSetId: 'RemOnline',
  });
  await createOrResetTableByName({
    bqTableId: 'orders_attachments',
    schema: orderAttachmentsTableSchema,
    dataSetId: 'RemOnline',
  });
  await createOrResetTableByName({
    bqTableId: 'orders_to_resources',
    schema: orders2ResourcesTableSchema,
    dataSetId: 'RemOnline',
  });
  await createOrResetTableByName({
    bqTableId: 'orders_resources',
    schema: orderResourcesTableSchema,
    dataSetId: 'RemOnline',
  });
  // await createOrResetTableByName({
  //   bqTableId: 'orders_campaigns',
  //   schema: campaignsTableSchema,
  //   dataSetId: 'RemOnline',
  // });
}

export async function loadRemonlineOrdersAndSynchronizeProductPrices() {
  const result = await loadRemonlineOrders();
  if (!result) {
    return;
  }
  const { order_ids } = result;
  await loadRemonlineOrderProductPricesToBQ1Thread(order_ids);
}
if (process.env.ENV === 'TEST') {
  console.log(`running loadRemonlineOrders in Test mode...`);
  await remonlineTokenToEnv(true);
  await loadRemonlineOrders();

  // await createOrResetOrdersTables();
}
