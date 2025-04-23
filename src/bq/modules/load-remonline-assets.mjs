import {getAssets} from '../../remonline/remonline.utils.mjs'

import { remonlineTokenToEnv } from '../../remonline/remonline.api.mjs';

export async function loadRemonlineAssetsToBQ(){
    const {assets}= await getAssets();
    console.log({assets})
    const stat=assets.reduce((acc, curr) => {
        const { id } = curr;
        if (!acc.has(id)) {
          acc.set(id, 1);
        } else {
          acc.set(id, acc.get(id) + 1);
        }
        return acc;
      }, new Map());
      console.log(stat)
}

if(process.env.ENV==='TEST'){
    await remonlineTokenToEnv();
    await loadRemonlineAssetsToBQ();
}