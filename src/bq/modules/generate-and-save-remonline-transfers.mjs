import {
  getLocations,
  getTransfers,
} from '../../remonline/remonline.utils.mjs';
import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import {
  createOrResetTableByName,
  getColumnsFromBQ,
  insertRowsAsStream,
} from '../bq-utils.mjs';
import {
  transferProductsTableSchema,
  transfersTableSchema,
} from '../schemas.mjs';

const splitTransfers = ({ transfersWithProducts }) =>
  transfersWithProducts.reduce(
    (acc, transfer) => {
      const _transfer = structuredClone(transfer);
      const _products = structuredClone(_transfer.products).map((product) => {
        const _product = {
          ...product,
          uom_id: product.uom.id,
          uom_description: product.uom.description,
          uom_title: product.uom.title,
          transfer_id: _transfer.id,
        };
        delete _product.uom;
        return _product;
      });

      delete _transfer.products;

      acc.products.push(..._products);
      acc.transfers.push(_transfer);

      return acc;
    },
    { transfers: [], products: [] }
  );
const filterTransfersAndProducts = async ({ transfers, products }) => {
  const presentTransfers = await getColumnsFromBQ(
    { table_id: 'transfers' },
    'id',
    'branch_id'
  );
  const presentProducts = await getColumnsFromBQ(
    { table_id: 'transfers_products' },
    'id',
    'transfer_id'
  );
  const filteredTransfers = transfers.filter(
    (transfer) =>
      !presentTransfers.some(
        (presentTransfer) =>
          transfer.id === presentTransfer.id &&
          transfer.branch_id === presentTransfer.branch_id
      )
  );
  const filteredProducts = products.filter(
    (product) =>
      !presentProducts.some(
        (presentProduct) =>
          product.transfer_id === presentProduct.transfer_id &&
          product.id === presentProduct.id
      )
  );
  return { filteredTransfers, filteredProducts };
};
export async function generateAndSaveTransfers() {
  const branches = await getLocations();
  if (branches.length === 0) {
    console.error('No branches found.');
    return;
  }
  const transfersWithProducts = [];
  console.log(
    'fetching transfers...\nwait please it could take few minutes...'
  );
  for (const [index, branch] of branches.entries()) {
    // if (process.env.ENV === 'TEST' && index !== branches.length - 1) {
    //   continue;
    // }
    const { id: branch_id } = branch;
    const { transfers } = await getTransfers({ branch_id });
    transfersWithProducts.push(...transfers);
  }

  const { transfers, products } = splitTransfers({ transfersWithProducts });
  // const { filteredTransfers, filteredProducts } =
  //   await filterTransfersAndProducts({
  //     transfers,
  //     products,
  //   });
  try {
    if (transfers.length > 0) {
      await insertRowsAsStream({
        rows: transfers,
        bqTableId: 'transfers',
      });
      console.log(`${transfers.length} transfers have been uploaded to BQ`);
    }
    if (products.length > 0) {
      await insertRowsAsStream({
        rows: products,
        bqTableId: 'transfers_products',
      });
      console.log(`${products.length} products have been uploaded to BQ`);
    }
    // if (filteredTransfers.length > 0) {
    //   await insertRowsAsStream({
    //     rows: filteredTransfers,
    //     bqTableId: 'transfers',
    //   });
    //   console.log(
    //     `${filteredTransfers.length} transfers have been uploaded to BQ,${transfers.length - filteredTransfers.length} coincidences were filtered `
    //   );
    // } else {
    //   console.log(
    //     `all transfers are already in BQ. Estimated rows count:${transfers.length}`
    //   );
    // }
    // if (filteredProducts.length > 0) {
    //   await insertRowsAsStream({
    //     rows: filteredProducts,
    //     bqTableId: 'transfers_products',
    //   });
    //   console.log(
    //     `${filteredProducts.length} Products have been uploaded to BQ,${products.length - filteredProducts.length} coincidences were filtered `
    //   );
    // } else {
    //   console.log(
    //     `all transfers are already in BQ. Estimated rows count:${products.length}`
    //   );
    // }
    //
    // console.log(
    //   'transfers and transfers_products insertions have been successfully finished.'
    // );
  } catch (e) {
    if (e.errors) {
      console.error(e.errors[0]);
    } else {
      console.error(e);
    }
  }
}
export async function resetTransfersTables() {
  await createOrResetTableByName({
    bqTableId: 'transfers',
    schema: transfersTableSchema,
  });
  await createOrResetTableByName({
    bqTableId: 'transfers_products',
    schema: transferProductsTableSchema,
  });
  console.log('the schemes have been generated successfully.');
}
if (process.env.ENV === 'TEST') {
  console.log('generateAndSaveTransfers testing...');

  const env = process.env.BQ_DATASET_ID;
  process.env.BQ_DATASET_ID = 'RemOnline';

  await remonlineTokenToEnv();
  await generateAndSaveTransfers();
  process.env.BQ_DATASET_ID = env;
}
if (process.env.ENV === 'TEST_RESET') {
  console.log('resetTransfersTables testing...');
  const env = process.env.BQ_DATASET_ID;
  process.env.BQ_DATASET_ID = 'RemOnline';
  await resetTransfersTables();
  process.env.BQ_DATASET_ID = env;
}
