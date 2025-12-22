import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import {
  getOrderProductPrices,
  getOrderRelatedItems,
} from '../../remonline/remonline.utils.mjs';
import { chunkArray, devLog } from '../../shared/shared.utils.mjs';
import { getAllRemonlineOrderIds } from '../bq-queries.mjs';

// const productCustomFieldsMap = {
//   266913: 'originalPrice',
//   317530: 'finalPrice',
//   630747: 'Шина',
//   606851: '14%',
//   369837: '25%',
//   375921: '30%',
//   // 389671: 'Продажі СТО або 35%',
//   // 605934: 'Продажі СТО або 35%',
//   389671: '35%',
//   605934: '35%',
//   328830: 'Філія',
//   328833: 'СТО - Партнерський парк',
//   566140: '40%',
// };

const productCustomFieldsMap = {
  266913: 'originalPrice',
  317530: 'finalPrice',
  630747: 'Шина',
  606851: 'percent_14',
  369837: 'percent_25',
  375921: 'percent_30',
  // 389671: 'Продажі СТО або 35%',
  // 605934: 'Продажі СТО або 35%',
  389671: 'percent_35',
  605934: 'percent_35',
  328830: 'Філія',
  328833: 'STO_partners_park',
  566140: 'percent_40',
};
let processed = 0;
export const loadRemonlineOrderProductPricesToBQ = async (ids) => {
  // [].le
  devLog({
    module: 'loadRemonlineOrderProductPricesToBQ',
    date: new Date(),
    ids: ids && ids.length ? ids.length : null,
    start: ids && ids.length ? ids[0] : null,
    end: ids && ids.length ? ids[ids.length - 1] : null,
  });
  const order_ids = ids || (await getAllRemonlineOrderIds());
  // const order_ids = [{ order_id: 36271085 }];
  // const order_ids = [{ order_id: 40341084 }];
  //   devLog(order_ids);
  const allProducts = [];
  for (const [i, { order_id }] of order_ids.entries()) {
    const items = await getOrderRelatedItems(order_id);
    const products = items.filter((item) => item.entity.type == 'product');
    if (!products.length) {
      continue;
    }
    const product_ids = products.map((product) => product.entity.id);
    const productsWithPrices = await getOrderProductPrices(product_ids);
    devLog(i, order_id, product_ids);
    const parsedProducts = productsWithPrices.map((product) => {
      const prices = {};
      for (const id in product.prices) {
        if (!productCustomFieldsMap[id]) {
          continue;
        }
        prices[productCustomFieldsMap[id]] = product.prices[id];
      }
      return {
        product_id: product.id,
        order_id,
        title: product.title,
        prices,
      };
    });

    allProducts.push(...parsedProducts);
    if (i > 14) {
      break;
    }
  }
  devLog(allProducts.length);
};

if (process.env.ENV == 'TEST') {
  await remonlineTokenToEnv();
  loadRemonlineOrderProductPricesToBQ();
  // const order_ids = await getAllRemonlineOrderIds();
  // const chunked = chunkArray(order_ids, 10000);
  // const resp = await Promise.any(
  //   chunked.map((arr) => loadRemonlineOrderProductPricesToBQ(arr))
  // );
}
