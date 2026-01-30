import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import { getOrderStatuses } from '../../remonline/remonline.utils.mjs';
import { createOrResetTableByName, loadRowsViaJSONFile } from '../bq-utils.mjs';
import { orderStatusesTableSchema } from '../schemas.mjs';

export async function resetOrderStatusesTable() {
  await createOrResetTableByName({
    bqTableId: 'order_statuses',
    schema: orderStatusesTableSchema,
    dataSetId: 'RemOnline',
  });
}

const mapOrderStatuses = ({ statuses }) => {
  const handledStatuses = statuses.map((status) => {
    const { id, name, color, group, instance } = status;

    const handledStatus = {
      id,
      name,
      color,
      group,
      instance,
    };
    return handledStatus;
  });
  return { handledStatuses };
};

export async function loadOrderStatusesToBQ() {
  const { statuses } = await getOrderStatuses();
  console.log({
    time: new Date(),
    message: 'loadOrderStatusesToBQ',
    statusesCount: statuses.length,
  });
  const { handledStatuses } = mapOrderStatuses({ statuses });
  const resp = await loadRowsViaJSONFile({
    dataset_id: 'RemOnline',
    table_id: 'order_statuses',
    rows: handledStatuses,
    schema: orderStatusesTableSchema,
  });
}

if (process.env.ENV === 'TEST') {
    await remonlineTokenToEnv();
    await resetOrderStatusesTable();
    await loadOrderStatusesToBQ();
}
