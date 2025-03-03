import {getBrandingCardsInfo} from "../../web.api/web.api.utlites.mjs";
import { DateTime } from 'luxon';
import {list_188} from "../bitrix.constants.mjs";
import {
    cleanUpBrandingCards,
    getAllCrmBrandingItems,
    getCrmBrandingItemByDriverId,
    insertBrandingCard
} from "../bitrix.queries.mjs";
import {createDriverBrandingCardItem, updateDriverBrandingCardItem} from "../bitrix.utils.mjs";
async function resetCrmBrandingCards() {
    const dbcards = await getAllCrmBrandingItems();

    // if(!rows.length) throw new Error(`There isn't any existing card`);
    if (dbcards.length) {
        for (let i = 0; i < (cardsCount || dbcards.length); i++) {
            const {crm_card_id, ...rest} = dbcards[i];
            const resp = await updateDriverBrandingCardItem(crm_card_id, {...rest}, isNeededToFinish);
            // console.log(resp.crmItemId, 'has been updated');
        }
        await cleanUpBrandingCards();
        // console.log('Branding cards table has been cleaned up.');

    }
}
function coincidenceCheck(cards){
    //coincidence check by city name mistakes
    const set= new Set();
    cards.forEach((card) => {if(!list_188.some((obj)=>card.city===obj.city)) set.add(card.city)});
    if(set.size)
        throw new Error(`some cities hasn't assigned ids such as : ${Array.from(set).reduce((acc,curr) =>`"${curr}" ${acc}`,'')}`);

}


export function computePeriodBounds() {


    const today = DateTime.local().startOf('day');

    if(today.weekday===1)  return {
        lowerBound:'2025-03-01',
        upperBound:'2025-03-03'
    };
    const daysSinceSunday = today.weekday ; // This yields 0 when today is Sunday

    // Last Sunday is the current date minus the number of days since Sunday.
    const lowerBound = today.minus({ days: daysSinceSunday }).toISODate();
    const upperBound = today.toISODate();

    // Return the dates formatted as ISO strings (YYYY-MM-DD) for PostgreSQL
    return {
        lowerBound,
        upperBound
    };
}
function computeDriverBrandingCardItemStage(total_trips,isNeededToFinish){
    let trips=Number(total_trips);
    if(isNaN(trips)) throw new Error('Trips must be a number');
    if(isNeededToFinish){
        if(trips>=90){
            return 'DT1138_62:SUCCESS';
        }
        return 'DT1138_62:FAIL';
    }
    if(trips>=90){
        return 'DT1138_62:PREPARATION';
    }
    else if(trips<30){
        return 'DT1138_62:CLIENT';
    }
    else {
        return 'DT1138_62:NEW';
    }
}
export async function createAndUpdateDriverBrandingCards(isNeededToFinish,cardsCount) {
    if(isNeededToFinish) resetCrmBrandingCards();
    const bounds=computePeriodBounds();
    console.log("bounds:",bounds);
    const {rows} = await getBrandingCardsInfo(bounds);
    console.log(rows);
    // console.log(rows);
    if(!(rows instanceof Array)){

        coincidenceCheck(rows);

        for(let i=0; i<(cardsCount||rows.length); i++){

            let dbcard=await getCrmBrandingItemByDriverId(rows[i]);
            console.log(dbcard?`crmBrandingItem${dbcard.driver_id} already exists`:`crmBrandingItem${rows[i].driver_id} doesnt exist`);
            if(!dbcard){
                await insertBrandingCard(await createDriverBrandingCardItem(rows[i]));
                dbcard=await getCrmBrandingItemByDriverId(rows[i]);
            }
            else{
                // const resp= await updateDriverBrandingCardItem(dbcard.crm_card_id,{...rows[i],driver_name: "upd sss"});
                const resp= await updateDriverBrandingCardItem(dbcard.crm_card_id,{...rows[i]},isNeededToFinish);

            }


        }

    }

}