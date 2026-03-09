import { getProducts } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

function formatProduct(product) {
  const {
    id,
    code,
    title,
    is_serial,
    article,
    description,
    is_enable_expiration_tracking,
    is_expiration_tracking_enabled,
    is_expiring_soon_alert_enabled,
    is_critical_alert_enabled,
    default_supplier_id,
    category,
    uom,
    warranty,
    warranty_period,
    prices,
    images,
    custom_fields,
    is_dimensions_weight_enabled,
  } = product;

  return {
    id,
    code: code || '',
    title: title || '',
    isSerial: is_serial || false,
    article: article || '',
    description: description || '',
    isEnableExpirationTracking: is_enable_expiration_tracking || false,
    isExpirationTrackingEnabled: is_expiration_tracking_enabled || false,
    isExpiringSoonAlertEnabled: is_expiring_soon_alert_enabled || false,
    isCriticalAlertEnabled: is_critical_alert_enabled || false,
    defaultSupplierId: default_supplier_id,
    categoryId: category?.id,
    categoryTitle: category?.title,
    uomId: uom?.id,
    warranty: warranty || 0,
    warrantyPeriod: warranty_period || 0,
    prices: prices || {},
    images: images || [],
    customFields: custom_fields || {},
    isDimensionsWeightEnabled: is_dimensions_weight_enabled || false,
  };
}

export async function loadRemonlineProducts() {
  const time = new Date();
  devLog({
    time,
    message: 'loadRemonlineProducts starting',
  });

  const dbCount = await prisma.product.count();
  const PAGE_SIZE = 50;
  // Calculate the starting page based on the number of products already in the database
  const startPage = Math.ceil(dbCount / PAGE_SIZE) || 1;

  devLog({
    message: 'Calculated starting page',
    dbCount,
    startPage,
  });

  let currentBatch = [];
  let currentBatchPages = 0;
  const BATCH_PAGES_LIMIT = 100;
  let totalSaved = 0;

  const saveBatch = async (productsToSave, pageMarker) => {
    if (!productsToSave || productsToSave.length === 0) return;

    devLog({
      productsCount: productsToSave.length,
      message: `Formatting products for database upsert. Batch marker: ${pageMarker}`,
    });

    const formattedProducts = productsToSave.map(formatProduct);

    try {
      devLog('Starting product upsert for batch...');

      const productIds = formattedProducts.map((p) => p.id);

      // Separate existing vs new to manually upsert without Prisma trying to mess with relations
      const existingProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true },
      });
      const existingIds = new Set(existingProducts.map((p) => p.id));

      const toCreate = formattedProducts.filter((p) => !existingIds.has(p.id));
      const toUpdate = formattedProducts.filter((p) => existingIds.has(p.id));

      await prisma.$transaction(
        async (tx) => {
          if (toCreate.length > 0) {
            // Chunk createMany just in case it's huge (100 pages = 5000 items)
            const chunkSize = 1000;
            for (let i = 0; i < toCreate.length; i += chunkSize) {
              await tx.product.createMany({
                data: toCreate.slice(i, i + chunkSize),
              });
            }
          }

          for (const product of toUpdate) {
            const { id, ...updateData } = product;
            await tx.product.update({
              where: { id: product.id },
              data: updateData,
            });
          }
        },
        {
          maxWait: 10000,
          timeout: 120000,
        }
      );

      totalSaved += formattedProducts.length;
      devLog(
        `[PROGRESS SAVED] 100-page batch successfully processed (Created: ${toCreate.length}, Updated: ${toUpdate.length}) up to page ${pageMarker}. Total saved so far: ${totalSaved}`
      );
    } catch (e) {
      console.error({
        module: 'loadRemonlineProducts - saveBatch',
        date: new Date(),
        error: e.errors ? e.errors[0] : e,
        message: e.message,
      });
      throw e;
    }
  };

  try {
    let lastFetchedPage = startPage;
    for await (const { products, page } of getProducts(startPage)) {
      if (products && products.length > 0) {
        currentBatch.push(...products);
      }
      currentBatchPages++;
      lastFetchedPage = page;

      if (currentBatchPages >= BATCH_PAGES_LIMIT) {
        await saveBatch(currentBatch, page);
        currentBatch = [];
        currentBatchPages = 0;
      }
    }

    // Save any remaining products in the last partial batch
    if (currentBatch.length > 0) {
      await saveBatch(currentBatch, lastFetchedPage);
    }

    devLog({
      message: 'Finished loadRemonlineProducts',
      totalSaved,
    });
  } catch (e) {
    devLog({
      function: 'loadRemonlineProducts',
      message: 'Error while fetching or saving products from RemOnline API',
      error: {
        status: e?.status,
        page: e?.page,
        url: e?.url,
        message: e?.message,
      },
    });
    throw e;
  }
}

if (process.env.ENV === 'TEST') {
  devLog('Running loadRemonlineProducts in TEST mode...');
  await remonlineTokenToEnv(true);
  await loadRemonlineProducts();
}
