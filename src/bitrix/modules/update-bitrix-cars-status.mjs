import {getCardIdsFromSpecialEntity, getAllSpecialEntityRows,updateCarStatusAndBrnad}from '../bitrix.utils.mjs';

if(process.env.ENV == 'TEST') {
    const bitrixResponse=await getCardIdsFromSpecialEntity(138)
    // // const bitrixResponse2=await getAllSpecialEntityRows(138)
    console.log(bitrixResponse,bitrixResponse.length)
    // console.log(bitrixResponse2,bitrixResponse2.length)
    const bitrixResp=await updateCarStatusAndBrnad({status:7004,brand:'Присутнє',bitrix_card_id:9092})
    console.log(bitrixResp)
}