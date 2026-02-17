import { getPostings } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

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
        idLabel: id_label,
        createdAt: created_at,
        createdById: created_by_id,
        supplierId: supplier_id,
        warehouseId: warehouse_id,
        description,
        documentNumber: document_number,
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
          postingId: id,
          title,
          uomId: uom?.id,
          code,
          article,
          amount,
          price,
          isSerial: is_serial,
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

  const latestPosting = await prisma.posting.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  const maxCreatedAt = latestPosting?.createdAt
    ? Number(latestPosting.createdAt)
    : 0;
  const createdAtFrom = maxCreatedAt ? maxCreatedAt + 1000 : 1000;
  const createdAtTo = Date.now();
  devLog({ createdAtFrom, createdAtTo });

  let postings = [];
  try {
    const result = await getPostings({ createdAtFrom, createdAtTo });
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
    createdAtFrom,
    createdAtTo,
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
      await prisma.posting.createMany({
        data: postingsRows,
        skipDuplicates: true,
      });
      devLog(
        `${postingsRows.length} postings have been uploaded to remonline_postings`
      );
    }

    if (postingProductsRows.length > 0) {
      await prisma.postingProduct.createMany({
        data: postingProductsRows,
        skipDuplicates: true,
      });
      devLog(
        `${postingProductsRows.length} posting products have been uploaded to posting_products`
      );
    }
  } catch (e) {
    console.error({
      module: 'loadRemonlinePostings',
      date: new Date(),
      error: e.errors ? e.errors[0] : e,
    });
    throw e;
  }
}

if (process.env.ENV === 'TEST') {
  devLog('Running loadRemonlinePostingsForListedSuppliers in TEST mode...');
  await remonlineTokenToEnv(true);
  await loadRemonlinePostings();
}
