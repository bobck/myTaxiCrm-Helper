import { getLocations, getTransfers } from "../../remonline/remonline.utils.mjs";
import { remonlineTokenToEnv } from "../../remonline/remonline.api.mjs";

export async function generateAndSaveTransfers(){

    const branches=await getLocations();
    if(branches.length === 0){
        console.error('No branches found.');
        return;
    }
    console.log(branches);
    const _transfers=[];
    for (const [index,branch] of branches.entries()) {

        const{id:branch_id}=branch;
        const { transfers } =await getTransfers({ branch_id });
        _transfers.push(...transfers);
    }
    console.log(_transfers.length);
    
    
}

if(process.env.ENV==='TEST'){
    console.log('generateAndSaveTransfers testing...');

    await remonlineTokenToEnv();
    await generateAndSaveTransfers();
}