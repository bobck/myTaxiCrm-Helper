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
    if (process.env.ENV === 'TEST' && index !== branches.length - 1) {
      continue;
    }
    const { id: branch_id } = branch;
    const { transfers } = await getTransfers({ branch_id });
    transfersWithProducts.push(...transfers);
  }

  const { transfers, products } = splitTransfers({ transfersWithProducts });

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
    dataSetId: 'RemOnline',
  });
  await createOrResetTableByName({
    bqTableId: 'transfers_products',
    schema: transferProductsTableSchema,
    dataSetId: 'RemOnline',
  });
  console.log('the schemes have been generated successfully.');
}
if (process.env.ENV === 'TEST') {
  await remonlineTokenToEnv();
  await generateAndSaveTransfers();
}
if (process.env.ENV === 'TEST_RESET') {
  console.log('resetTransfersTables testing...');
  await resetTransfersTables();
}
