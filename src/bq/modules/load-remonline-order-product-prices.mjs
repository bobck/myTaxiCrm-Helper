import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import { getOrderRelatedItems } from '../../remonline/remonline.utils.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { getAllRemonlineOrderIds } from '../bq-queries.mjs';

export const loadRemonlineOrderProductPricesToBQ = async () => {
  devLog({ module: 'loadRemonlineOrderProductPricesToBQ', date: new Date() });
  //   const order_ids = await getAllRemonlineOrderIds();
  const order_ids = [{ order_id: 36271085 }];
  //   devLog(order_ids);
  for (const [i, { order_id }] of order_ids.entries()) {
    const items = await getOrderRelatedItems(order_id);
    const products = items.filter((item) => item.entity.type == 'product');
    const product_ids = products.map((product) => product.entity.id);
    devLog(i, order_id, product_ids);

    if (i > 15) break;
  }
};

if (process.env.ENV == 'TEST') {
  await remonlineTokenToEnv();
  loadRemonlineOrderProductPricesToBQ();
}
