import { getLocations, getTransfers } from "../../remonline/remonline.utils.mjs";
import { remonlineTokenToEnv } from "../../remonline/remonline.api.mjs";
import { createOrResetTableByName, createTableReportTable, insertRowsAsStream } from "../bq-utils.mjs";
import { transferProductsTableSchema, transfersTableSchema } from "../schemas.mjs";


const splitTransfers=({transfersWithProducts})=>transfersWithProducts.reduce((acc, transfer)=>{
    const _transfer=structuredClone(transfer);
    const _products=structuredClone(_transfer.products).map(product=>{
        const _product={
            ...product,
            uom_id:product.uom.id,
            uom_description:product.uom.description,
            uom_title:product.uom.title,
            transfer_id:_transfer.id
        }
        delete _product.uom;
        return _product;
    });

    delete _transfer.products;

    acc.products.push(..._products);
    acc.transfers.push(_transfer);

    return acc;
},{transfers:[],products:[]})





export async function generateAndSaveTransfers(){
    const branches=await getLocations();
    if(branches.length === 0){
        console.error('No branches found.');
        return;
    }
    const transfersWithProducts=[];
    console.log("fetching transfers...\nwait please it could take few minutes...");
    for (const [index,branch] of branches.entries()) {
        if(process.env.ENV === "TEST"&&index!==branches.length-1){
            continue;
        }
        const{id:branch_id}=branch;
        const { transfers } =await getTransfers({ branch_id });
        transfersWithProducts.push(...transfers);
    }
    const {transfers, products} = splitTransfers({ transfersWithProducts });


    try{
        await insertRowsAsStream({ rows: transfers, bqTableId: 'transfers' });
        await insertRowsAsStream({ rows: products, bqTableId: 'transfers_products' });
        console.log("transfers and transfers products insertions have been successfully finished.");
    }
    catch(e) {
        console.log(e.errors[0]);
    }

}
export async function resetTransfersTables(){
        await createOrResetTableByName({bqTableId:'transfers',schema:transfersTableSchema});
        await createOrResetTableByName({bqTableId:'transfers_products',schema:transferProductsTableSchema});
        console.log('the schemes have been generated successfully.');
}
if(process.env.ENV==='TEST'){
    console.log('generateAndSaveTransfers testing...');
    console.log(process.env.BQ_DATASET_ID)
    await remonlineTokenToEnv();
    await generateAndSaveTransfers();
}
if (process.env.ENV === "TEST_RESET") {
    console.log('resetTransfersTables testing...');
    await resetTransfersTables();
}