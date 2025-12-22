import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import {
  getRemonlineOrderProductPrices,
  getOrderRelatedItems,
} from '../../remonline/remonline.utils.mjs';
import {
  chunkArray,
  devLog,
  sliceArrayIntoEqualParts,
} from '../../shared/shared.utils.mjs';
import { getAllRemonlineOrderIds } from '../bq-queries.mjs';
import { createOrResetTableByName, loadRowsViaJSONFile } from '../bq-utils.mjs';
import { assetTableSchema, remonlineProductPrices } from '../schemas.mjs';

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
let processed = 0;
const getOrderProductPrices = async (ids) => {
  devLog({
    module: 'getOrderProductPrices',
    date: new Date(),
    ids: ids && ids.length ? ids.length : null,
    start: ids && ids.length ? ids[0] : null,
    end: ids && ids.length ? ids[ids.length - 1] : null,
  });
  const order_ids = ids || (await getAllRemonlineOrderIds());

  const allProducts = [];
  for (const [i, { order_id }] of order_ids.entries()) {
    const items = await getOrderRelatedItems(order_id);
    const products = items.filter((item) => item.entity.type == 'product');
    if (!products.length) {
      continue;
    }
    const product_ids = products.map((product) => product.entity.id);
    const productsWithPrices =
      await getRemonlineOrderProductPrices(product_ids);
    // devLog(i, order_id, product_ids);
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
    // if (i > 14) {
    //   break;
    // }
    devLog(`processed: ${++processed}`);
  }
  await loadRowsViaJSONFile({
    dataset_id: 'RemOnline',
    table_id: 'product_prices',
    rows: prices,
    schema: remonlineProductPrices,
  });
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

export const loadRemonlineOrderProductPricesToBQ = async (ids) => {
  const order_ids = await getAllRemonlineOrderIds();
  for (const arr of chunkArray(order_ids, 3000)) {
    const chunks = sliceArrayIntoEqualParts(arr, 3);
    devLog(`chunks:${chunks.length}`);

    const prices = (
      await Promise.all(chunks.map((arr) => getOrderProductPrices(arr)))
    ).flat();
    devLog('sleeping...');
    await new Promise((r) => setTimeout(r, 10000));
  }
};

if (process.env.ENV == 'TEST') {
  // await resetOrderProductPricesTable();
  await remonlineTokenToEnv();
  loadRemonlineOrderProductPricesToBQ();
}
