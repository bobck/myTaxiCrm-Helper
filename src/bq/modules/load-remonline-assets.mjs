import { getAssets } from '../../remonline/remonline.utils.mjs';

import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';
import { createOrResetTableByName, loadRowsViaJSONFile } from '../bq-utils.mjs';
import { assetTableSchema } from '../schemas.mjs';
export async function resetAssetTable() {
  await createOrResetTableByName({
    bqTableId: 'assets',
    schema: assetTableSchema,
    dataSetId: 'RemOnline',
  });
}
const mapAssets = ({ assets }) => {
  const handledAssets = assets.map((asset) => {
    const {
      id,
      uid,
      title,
      color,
      state,
      cost,
      group,
      brand,
      model,
      modification,
      description,
      year,
      reg_number,
      warehouse,
      image,
      custom_fields,
      owner,
    } = asset;

    const owner_name =
      typeof owner === 'string' ? asset.owner : asset.owner?.name;
    const handledAsset = {
      id,
      uid,
      title,
      color,
      state,
      cost,
      group,
      brand,
      model,
      modification,
      description,
      year,
      reg_number,
      owner_name,
      warehouse,
      image,
      custom_fields,
    };
    return handledAsset;
  });
  return { handledAssets };
};
export async function loadRemonlineAssetsToBQ() {
  const { assets } = await getAssets();
  console.log({
    time: new Date(),
    message: 'loadRemonlineAssetsToBQ',
    assetsCount: assets.length,
  });
  const { handledAssets } = mapAssets({ assets });
  const resp = await loadRowsViaJSONFile({
    dataset_id: 'RemOnline',
    table_id: 'assets',
    rows: handledAssets,
    schema: assetTableSchema,
  });
}

if (process.env.ENV === 'TEST') {
  await remonlineTokenToEnv();
  //   await resetAssetTable();
  await loadRemonlineAssetsToBQ();
}
