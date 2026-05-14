import { getUOMs } from '../remonline.utils.mjs';
import prisma from '../remonline.prisma.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { remonlineTokenToEnv } from '../remonline.api.mjs';

export async function syncRemonlineUOMs() {
  const time = new Date();
  devLog({ time, message: 'syncRemonlineUOMs' });

  const { uoms, uom_types, entity_types } = await getUOMs();

  devLog({ message: `Fetched ${uoms.length} UOMs from Remonline` });

  let upserted = 0;

  for (const uom of uoms) {
    const data = {
      description: uom.description,
      title: uom.title,
      uomType: uom_types[uom.uom_type] || String(uom.uom_type),
      isImperial: uom.is_imperial,
      isSystem: uom.is_system,
      entityTypes: (uom.entity_types || []).map(
        (id) => entity_types[id] || String(id)
      ),
    };

    await prisma.uom.upsert({
      where: { id: uom.id },
      create: { id: uom.id, ...data },
      update: data,
    });

    upserted++;
  }

  devLog({ message: `Upserted ${upserted} UOMs` });
}

if (process.env.ENV === 'TEST') {
  devLog('Running syncRemonlineUOMs in TEST mode...');
  await remonlineTokenToEnv(true);
  await syncRemonlineUOMs();
}
