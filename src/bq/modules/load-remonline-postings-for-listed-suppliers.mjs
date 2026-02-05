import { getPostings } from '../../remonline/remonline.utils.mjs';
import {
  createOrResetTableByName,
  loadRowsViaJSONFile,
  getMaxListedSuppliersPostingCreatedAt,
} from '../bq-utils.mjs';
import {
  listedSuppliersPostingsTableSchema,
  postingProductsTableSchema,
} from '../schemas.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';

const dataset_id = 'RemOnline';

function splitPostingsAndProducts({ postings }) {
  return postings.reduce(
    (acc, posting) => {
      const {
        id,
        id_label,
        created_at,
        created_by_id,
        supplier_id,
        warehouse_id,
        description,
        document_number,
        products = [],
      } = posting;

      const postingRow = {
        id,
        id_label,
        created_at,
        created_by_id,
        supplier_id,
        warehouse_id,
        description,
        document_number,
      };

      acc.postingsRows.push(postingRow);

      for (const product of products) {
        const {
          id: productId,
          title,
          uom,
          code,
          article,
          amount,
          price,
          is_serial,
          sernums,
        } = product;

        const productRow = {
          id: productId,
          posting_id: id,
          title,
          uom_id: uom?.id,
          code,
          article,
          amount,
          price,
          is_serial,
          sernums,
        };

        acc.postingProductsRows.push(productRow);
      }

      return acc;
    },
    { postingsRows: [], postingProductsRows: [] }
  );
}

export async function loadRemonlinePostingsForListedSuppliers() {
  const time = new Date();
  devLog({
    time,
    message: 'loadRemonlinePostingsForListedSuppliers',
  });

  const maxCreatedAt = await getMaxListedSuppliersPostingCreatedAt();
  const createdAtForApi = maxCreatedAt ? maxCreatedAt + 1000 : undefined;

  const { postings } =
    (await getPostings({ createdAt: createdAtForApi })) || {};

  devLog({
    maxCreatedAt,
    createdAtForApi,
    postingsCount: postings.length,
  });

  if (!postings || postings.length === 0) {
    devLog('No new postings to load.');
    return;
  }

  const { postingsRows, postingProductsRows } = splitPostingsAndProducts({
    postings,
  });

  try {
    if (postingsRows.length > 0) {
      await loadRowsViaJSONFile({
        dataset_id,
        table_id: 'listed_suppliers_postings',
        rows: postingsRows,
        schema: listedSuppliersPostingsTableSchema,
      });
      devLog(
        `${postingsRows.length} postings have been uploaded to BQ table listed_suppliers_postings`
      );
    }

    if (postingProductsRows.length > 0) {
      await loadRowsViaJSONFile({
        dataset_id,
        table_id: 'posting_products',
        rows: postingProductsRows,
        schema: postingProductsTableSchema,
      });
      devLog(
        `${postingProductsRows.length} posting products have been uploaded to BQ table posting_products`
      );
    }
  } catch (e) {
    if (e.errors) {
      console.error(e.errors[0]);
    } else {
      console.error(e);
    }
    throw e;
  }
}

async function resetRemonlinePostingsTables() {
  await createOrResetTableByName({
    bqTableId: 'listed_suppliers_postings',
    schema: listedSuppliersPostingsTableSchema,
    dataSetId: dataset_id,
  });
  await createOrResetTableByName({
    bqTableId: 'posting_products',
    schema: postingProductsTableSchema,
    dataSetId: dataset_id,
  });
  devLog('RemOnline postings tables have been reset successfully.');
}

if (process.env.ENV === 'TEST') {
  devLog('Running loadRemonlinePostingsForListedSuppliers in TEST mode...');
  // await resetRemonlinePostingsTables();
  await remonlineTokenToEnv();
  await loadRemonlinePostingsForListedSuppliers();
}
