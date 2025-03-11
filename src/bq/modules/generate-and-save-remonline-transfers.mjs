import { getLocations, getTransfers } from "../../remonline/remonline.utils.mjs";
import { remonlineTokenToEnv } from "../../remonline/remonline.api.mjs";
const splitTransfers=({_transfers})=>_transfers.reduce((acc, transfer)=>{
    const _transfer=structuredClone(transfer);
    const _products=structuredClone(_transfer.products).map(product=>{
        const _product={...product,uom_id:product.uom.id,transfer_id:_transfer.id }
        if(!acc.uoms.some((uom)=>uom.id===product.uom.id)){
            acc.uoms.push(_product.uom);
        }
        delete _product.uom;
        return _product;
    });

    delete _transfer.products;

    acc.products.push(..._products);
    acc.transfers.push(_transfer);

    return acc;
},{transfers:[],products:[],uoms:[]})





export async function generateAndSaveTransfers(){

    const branches=await getLocations();
    if(branches.length === 0){
        console.error('No branches found.');
        return;
    }
    const _transfers=[];
    console.log("fetching transfers...\nwait please it could take few minutes...");
    for (const [index,branch] of branches.entries()) {

        const{id:branch_id}=branch;
        const { transfers } =await getTransfers({ branch_id });
        _transfers.push(...transfers);
    }
    console.log("...data fetched");
    const {transfers, products, uoms} = splitTransfers({ _transfers });
    console.log("products", products.length,"transfers", transfers.length,"uoms",uoms.length);
    
    
}

if(process.env.ENV==='TEST'){
    console.log('generateAndSaveTransfers testing...');

    await remonlineTokenToEnv();
    await generateAndSaveTransfers();
}