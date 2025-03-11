import { getLocations, getTransfers } from "../../remonline/remonline.utils.mjs";
import { remonlineTokenToEnv } from "../../remonline/remonline.api.mjs";

export async function generateAndSaveTransfers(){

    const branches=await getLocations();
    if(branches.length === 0){
        console.error('No branches found.');
        return;
    }
    console.log(branches);

    for (const branch of branches) {
        const{id:branch_id}=branch;
        const transfers =await getTransfers({ branch_id });
        const handledTransfers=transfers.map(transfer=>{return {branch_id,...transfer}});
        console.log(handledTransfers);
    }
    
    
}

if(process.env.ENV==='TEST'){
    console.log('generateAndSaveTransfers testing...');

    await remonlineTokenToEnv();
    await generateAndSaveTransfers();
}