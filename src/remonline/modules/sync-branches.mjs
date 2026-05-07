import { getLocationsV2 } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog, isoOrNull } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

export async function syncBranches() {
  const time = new Date();
  devLog({ time, message: 'syncBranches' });

  const branches = await getLocationsV2();
  devLog({ message: `Fetched ${branches.length} branches from Remonline` });

  let upserted = 0;
  for (const b of branches) {
    const data = {
      createdAt: isoOrNull(b.created_at) ?? new Date(0),
      name: b.name,
      address: b.address ?? null,
      isArchived: !!b.is_archived,
      legalEntityId: b.legal_entity_id ?? null,
      timezone: b.timezone ?? null,
    };
    await prisma.branch.upsert({
      where: { id: b.id },
      create: { id: b.id, ...data },
      update: data,
    });
    upserted++;
  }

  devLog({ message: `Upserted ${upserted} branches` });
}

if (process.env.ENV === 'TEST') {
  devLog({ message: 'Running syncBranches in TEST mode...' });
  await remonlineTokenToEnv(true);
  await syncBranches();
}
