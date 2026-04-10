import { getRefunds } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

function mapRefund(refund) {
  const {
    id,
    number,
    branch_id,
    created_at,
    created_by_id,
    client,
    comment,
    related_document,
    total,
  } = refund;

  return {
    id,
    number,
    branchId: branch_id,
    createdAt: new Date(created_at),
    createdById: created_by_id,
    clientId: client?.id ?? null,
    clientName: client?.name ?? null,
    comment: comment || null,
    relatedDocumentId: related_document?.id ?? null,
    relatedDocumentType: related_document?.type ?? null,
    total: parseFloat(total),
  };
}

export async function loadRemonlineRefunds() {
  const time = new Date();
  devLog({ time, message: 'loadRemonlineRefunds' });

  const lastRefund = await prisma.refund.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  const createdAt = lastRefund
    ? new Date(lastRefund.createdAt.getTime() + 1000)
        .toISOString()
        .replace(/\.\d{3}Z$/, 'Z') // API fails with 400 if miliseconds are passed to the filter
    : null;

  devLog({
    message: `Last known refund createdAt: ${lastRefund?.createdAt}, fetching from: ${createdAt}`,
  });

  const { refunds } = await getRefunds({ createdAt });

  if (refunds.length === 0) {
    devLog({ message: 'No new refunds found' });
    return;
  }

  const rows = refunds.map(mapRefund);

  const result = await prisma.refund.createMany({
    data: rows,
  });

  devLog({
    message: `Loaded ${result.count} new refunds`,
  });
}

if (process.env.ENV === 'TEST') {
  devLog('Running loadRemonlineRefunds in TEST mode...');
  await remonlineTokenToEnv(true);
  await loadRemonlineRefunds();
}
