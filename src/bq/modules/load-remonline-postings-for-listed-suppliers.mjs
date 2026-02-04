import { getPostingsBySupplier } from '../../remonline/remonline.utils.mjs';
import {
  createOrResetTableByName,
  loadRowsViaJSONFile,
  getListedSuppliersFromBQ,
  updateSuppliersLastPostingAt,
  resetSuppliersLastPostingAtToNull,
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

  const suppliers = await getListedSuppliersFromBQ();
  devLog({
    message: 'Fetched listed suppliers from BigQuery',
    suppliersCount: suppliers.length,
  });

  if (!suppliers || suppliers.length === 0) {
    devLog('No listed suppliers found in BigQuery.');
    return;
  }

  const allPostings = [];

  for (const supplier of suppliers) {
    const supplierId = supplier.supplier_id;
    const lastPostingAt = supplier.last_posting_at || 0;

    if (!supplierId) {
      continue;
    }

    try {
      const { postings } = await getPostingsBySupplier({
        supplierId,
        createdAt: lastPostingAt + 1000,
      });

      devLog({
        supplierId,
        lastPostingAt,
        postingsCount: postings.length,
      });

      allPostings.push(...postings);
    } catch (e) {
      console.error({
        function: 'loadRemonlinePostingsForListedSuppliers',
        message: 'Failed to load postings for supplier',
        supplierId,
        error: e?.message || e,
      });
    }
  }

  if (allPostings.length === 0) {
    devLog('No postings to load for listed suppliers.');
    return;
  }

  const { postingsRows, postingProductsRows } = splitPostingsAndProducts({
    postings: allPostings,
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

    await updateSuppliersLastPostingAt();
  } catch (e) {
    if (e.errors) {
      console.error(e.errors[0]);
    } else {
      console.error(e);
    }
    throw e;
  }
}

export async function resetRemonlinePostingsTables() {
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
  await resetSuppliersLastPostingAtToNull();
  devLog('RemOnline postings tables have been reset successfully.');
}

if (process.env.ENV === 'TEST') {
  devLog('Running loadRemonlinePostingsForListedSuppliers in TEST mode...');

  // await updateSuppliersLastPostingAt();
  // await resetRemonlinePostingsTables();
  await remonlineTokenToEnv();
  await loadRemonlinePostingsForListedSuppliers();
}
