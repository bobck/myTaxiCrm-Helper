import { getAssets } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

const CHUNK_SIZE = 1000;

function formatAsset(asset) {
  const ownerName =
    typeof asset.owner === 'string' ? asset.owner : asset.owner?.name;

  return {
    id: asset.id,
    uid: asset.uid,
    title: asset.title,
    color: asset.color,
    state: asset.state,
    cost: asset.cost,
    group: asset.group,
    brand: asset.brand,
    model: asset.model,
    modification: asset.modification,
    description: asset.description,
    year: asset.year,
    regNumber: asset.reg_number,
    ownerName,
    warehouse: asset.warehouse,
    address: asset.address,
    image: asset.image,
    customFields: asset.custom_fields,
  };
}

export async function syncRemonlineAssets() {
  const time = new Date();
  devLog({ time, message: 'syncRemonlineAssets' });

  const { assets } = await getAssets();
  devLog({ message: `Fetched ${assets.length} assets from Remonline` });

  if (assets.length === 0) return;

  const formatted = assets.map(formatAsset);
  const ids = formatted.map((a) => a.id);

  await prisma.$transaction(
    async (tx) => {
      await tx.asset.deleteMany({ where: { id: { in: ids } } });
      for (let i = 0; i < formatted.length; i += CHUNK_SIZE) {
        await tx.asset.createMany({
          data: formatted.slice(i, i + CHUNK_SIZE),
        });
      }
    },
    {
      maxWait: 10_000,
      timeout: 5 * 60 * 1000,
    }
  );

  devLog({
    message: 'syncRemonlineAssets — done',
    upserted: formatted.length,
  });
}

if (process.env.ENV === 'TEST') {
  devLog('Running syncRemonlineAssets in TEST mode...');
  await remonlineTokenToEnv(true);
  await syncRemonlineAssets();
}
