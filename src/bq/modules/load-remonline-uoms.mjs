import { getUOMs } from '../../remonline/remonline.utils.mjs';

import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import { createOrResetTableByName, loadRowsViaJSONFile } from '../bq-utils.mjs';
import { uomTableSchema } from '../schemas.mjs';
export async function resetUOMTable() {
  await createOrResetTableByName({
    bqTableId: 'uoms',
    schema: uomTableSchema,
    dataSetId: 'RemOnline',
  });
}
const mapUOMs = ({ uoms, uom_types, entity_types }) => {
  const handled_uoms = uoms.map((uom) => {
    return {
      ...uom,
      uom_type: uom_types[uom.uom_type] || uom.uom_type,
      entity_types: uom.entity_types.map((id) => entity_types[id] || id),
    };
  });
  return { handled_uoms };
};
export async function loadRemonlineUOMsToBQ() {
  const { uoms, uom_types, entity_types } = await getUOMs();
  console.log({
    time: new Date(),
    message: 'loadRemonlineUOMsToBQ',
    uomsCount: uoms.length,
  });
  const { handled_uoms } = mapUOMs({ uoms, uom_types, entity_types });
  await loadRowsViaJSONFile({
    dataset_id: 'RemOnline',
    table_id: 'uoms',
    rows: handled_uoms,
    schema: uomTableSchema,
  });
}

if (process.env.ENV === 'TEST') {
  await remonlineTokenToEnv(true);
  await loadRemonlineUOMsToBQ();
  // await resetUOMTable();
}
