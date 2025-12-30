import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import {
  getRemonlineOrderProductPrices,
  getOrderRelatedItems,
} from '../../remonline/remonline.utils.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { createOrResetTableByName, insertRowsAsStream } from '../bq-utils.mjs';
import { remonlineProductPrices } from '../schemas.mjs';

const productCustomFieldsMap = {
  266913: 'originalPrice',
  317530: 'finalPrice',
  // 630747: 'Шина',
  606851: 'percent_14',
  369837: 'percent_25',
  375921: 'percent_30',
  // 389671: 'Продажі СТО або 35%',
  // 605934: 'Продажі СТО або 35%',
  389671: 'percent_35',
  605934: 'percent_35',
  // 328830: 'Філія',
  328833: 'STO_partners_park',
  566140: 'percent_40',
};
const getOrderProductPrices = async (ids) => {
  devLog({
    module: 'getOrderProductPrices',
    date: new Date(),
    ids: ids && ids.length ? ids.length : null,
    start: ids && ids.length ? ids[0] : null,
    end: ids && ids.length ? ids[ids.length - 1] : null,
  });
  const order_ids = ids;

  const allProducts = [];
  for (const [i, { order_id }] of order_ids.entries()) {
    const items = await getOrderRelatedItems(order_id);
    if (!(items instanceof Array)) {
      console.error('items error', order_id, items.message);
      continue;
    }
    const products = items.filter((item) => item.entity.type == 'product');
    if (!products.length) {
      continue;
    }
    const product_ids = products.map((product) => product.entity.id);
    const productsWithPrices =
      await getRemonlineOrderProductPrices(product_ids);

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
        ...prices,
      };
    });

    allProducts.push(...parsedProducts);
  }

  devLog(allProducts.length);
  return allProducts;
};
export async function resetOrderProductPricesTable() {
  await createOrResetTableByName({
    bqTableId: 'product_prices',
    schema: remonlineProductPrices,
    dataSetId: 'RemOnline',
  });
}

export const loadRemonlineOrderProductPricesToBQ = async (order_ids) => {
  console.log({
    module: 'loadRemonlineOrderProductPricesToBQ',
    date: new Date(),
  });
  try {
    const prices = await getOrderProductPrices(order_ids);
    await insertRowsAsStream({
      dataset_id: 'RemOnline',
      bqTableId: 'product_prices',
      rows: prices,
    });
  } catch (e) {
    console.error(e);
  }
};

// if (process.env.ENV == 'TEST') {
//   // await resetOrderProductPricesTable();
//   await remonlineTokenToEnv(true);
//   loadRemonlineOrderProductPricesToBQ();
// }
