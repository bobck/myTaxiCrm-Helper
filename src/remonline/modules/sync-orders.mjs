import { getOrders } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

const PAGE_SIZE = 50;
const PAGES_PER_BATCH = 5;

async function getMaxOrderModifiedAt() {
  const r = await prisma.order.aggregate({ _max: { modifiedAt: true } });
  return r._max.modifiedAt;
}

export async function syncRemonlineOrders() {
  devLog({ time: new Date(), message: 'syncRemonlineOrders — start' });

  const maxModifiedAt = await getMaxOrderModifiedAt();
  const sort_dir = 'asc';

  let totalPages;
  let startPage = 1;

  while (true) {
    const targetPage = startPage + PAGES_PER_BATCH - 1;

    const { orders, count, lastPage } = await getOrders({
      modified_at: maxModifiedAt != null ? Number(maxModifiedAt) : undefined,
      sort_dir,
      startPage,
      targetPage,
    });

    if (totalPages == null && count != null) {
      totalPages = Math.ceil(count / PAGE_SIZE);
    }

    devLog({
      message: 'syncRemonlineOrders — batch fetched',
      startPage,
      targetPage,
      lastPage,
      fetched: orders?.length ?? 0,
      apiCount: count,
      totalPages,
    });

    if (!orders || orders.length === 0) break;
    if (totalPages != null && lastPage >= totalPages) break;

    startPage = lastPage + 1;
  }

  devLog({ message: 'syncRemonlineOrders — done', totalPages });
}

if (process.env.ENV === 'TEST') {
  devLog('Running syncRemonlineOrders in TEST mode...');
  await remonlineTokenToEnv(true);
  await syncRemonlineOrders();
}
