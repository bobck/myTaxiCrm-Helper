import lodash from 'lodash';

import { getOrders } from '../remonline.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';
import {
  getSidsWithNoId,
  markSidsWithNoIdAsParsed,
} from '../remonline.queries.mjs';
import { updateSidIdAndStatus } from '../remonline.queries.mjs';

export async function saveOrdersToSids() {
  console.log({ time: new Date(), message: 'saveOrdersToSids' });

  const result = await getSidsWithNoId();
  const idLabelsArray = result.map((r) => r.sid_lable);
  const idLabelsChunks = lodash.chunk(idLabelsArray, 50);

  if (result.length == 0) {
    return;
  }

  console.log(
    `${result.length} idLabels for parse, ${idLabelsChunks.length} chunks`
  );

  const chunksArray = [];

  for (let chunk of idLabelsChunks) {
    const ordersPromise = getOrders({ idLabels: chunk });
    chunksArray.push(ordersPromise);
  }

  const resolve = await Promise.all(chunksArray);
  const orders = resolve.map((r) => r.orders).flat();

  console.log(`${orders.length} orders get from api`);

  for (let order of orders) {
    const { id, id_label: idLabel, status } = order;
    const { id: statusId } = status;
    // console.log({ id, idLabel, statusId })
    let isClosed = false;
    if (statusId == process.env.CLOSED_STATUS_ID) {
      isClosed = true;
    }
    updateSidIdAndStatus({ id, statusId, isClosed, idLabel });
  }

  for (let idLabel of idLabelsArray) {
    markSidsWithNoIdAsParsed({ idLabel });
  }
}

if (process.env.ENV == 'TEST') {
  await remonlineTokenToEnv();
  saveOrdersToSids();
}
