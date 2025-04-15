import {getCardIdsFromSpecialEntity, getAllSpecialEntityRows}from '../bitrix.utils.mjs';

if(process.env.ENV == 'TEST') {
    const bitrixResponse=await getCardIdsFromSpecialEntity(138)
    // const bitrixResponse2=await getAllSpecialEntityRows(138)
    console.log(bitrixResponse,bitrixResponse.length)
    // console.log(bitrixResponse2,bitrixResponse2.length)
}