import { getLocations } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog, isoOrNull } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

export async function syncBranches() {
  const time = new Date();
  devLog({ time, message: 'syncBranches' });

  const branches = await getLocations();
  devLog({ message: `Fetched ${branches.length} branches from Remonline` });

  let upserted = 0;
  for (const branch of branches) {
    const data = {
      createdAt: isoOrNull(branch.created_at) ?? new Date(0),
      name: branch.name,
      address: branch.address ?? null,
      isArchived: !!branch.is_archived,
      legalEntityId: branch.legal_entity_id ?? null,
      timezone: branch.timezone ?? null,
    };
    await prisma.branch.upsert({
      where: { id: branch.id },
      create: { id: branch.id, ...data },
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
