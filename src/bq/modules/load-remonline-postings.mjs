import { getPostings } from '../../remonline/remonline.utils.mjs';
import { createOrResetTableByName, loadRowsViaJSONFile } from '../bq-utils.mjs';
import {
  getMaxPostingCreatedAt,
  synchronizeRemonlinePostings,
} from '../bq-queries.mjs';
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

export async function loadRemonlinePostings() {
  const time = new Date();
  devLog({
    time,
    message: 'loadRemonlinePostingsForListedSuppliers',
  });

  const maxCreatedAt = await getMaxPostingCreatedAt();
  const createdAtForApi = maxCreatedAt ? maxCreatedAt + 1000 : undefined;

  let postings = [];
  try {
    const result = await getPostings({ createdAt: createdAtForApi });
    postings = result?.postings || [];
  } catch (e) {
    postings = e?.postings || [];
    devLog({
      function: 'loadRemonlinePostingsForListedSuppliers',
      message: 'Error while fetching postings from RemOnline API',
      error: {
        status: e?.status,
        page: e?.page,
        url: e?.url,
        message: e?.message,
      },
      postingsFetched: postings.length,
    });
  }

  devLog({
    maxCreatedAt,
    createdAtForApi,
    postingsCount: postings?.length,
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
        table_id: 'remonline_postings',
        rows: postingsRows,
        schema: listedSuppliersPostingsTableSchema,
      });
      devLog(
        `${postingsRows.length} postings have been uploaded to BQ table remonline_postings`
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

    const postingsForSync = postingsRows.map((p) => ({
      id: p.id,
      created_at: p.created_at,
    }));
    await synchronizeRemonlinePostings({ postings: postingsForSync });
  } catch (e) {
    console.error({
      module: 'loadRemonlinePostings',
      date: new Date(),
      error: e.errors ? e.errors[0] : e,
    });
    throw e;
  }
}

async function resetRemonlinePostingsTables() {
  await createOrResetTableByName({
    bqTableId: 'remonline_postings',
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
  await resetRemonlinePostingsTables();
  await remonlineTokenToEnv(true);
  await loadRemonlinePostings();
}
