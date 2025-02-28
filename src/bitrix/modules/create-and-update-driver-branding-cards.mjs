import {getDriversRides} from "../../web.api/web.api.utlites.mjs";

import {list_188} from "../bitrix.constants.mjs";
import {cleanUpBrandingCards, getCrmBrandingItem, insertBrandingCard} from "../bitrix.queries.mjs";
import {createDriverBrandingCardItem, updateDriverBrandingCardItem} from "../bitrix.utils.mjs";

export async function createAndUpdateDriverBrandingCards(isNeededToFinish,cardsCount) {
    const {rows} = await getDriversRides();
    // console.log(rows);

    if(rows instanceof Array){


        //coincidence check by city name mistakes
        const set= new Set();
        rows.forEach((card) => {if(!list_188.some((obj)=>card.city===obj.city)) set.add(card.city)});
        if(set.size)
            throw new Error(`some cities hasn't assigned ids such as : ${Array.from(set).reduce((acc,curr) =>`"${curr}" ${acc}`,'')}`);

        for(let i=0; i<cardsCount||rows.length; i++){

            let dbcard=await getCrmBrandingItem(rows[i]);
            console.log(dbcard?`crmBrandingItem${dbcard.driver_id} already exists`:`crmBrandingItem${rows[i].driver_id} doesnt exist`);
            if(!dbcard){
                await insertBrandingCard(await createDriverBrandingCardItem(rows[i]));
                dbcard=await getCrmBrandingItem(rows[i]);
            }
            else{
                // const resp= await updateDriverBrandingCardItem(dbcard.crm_card_id,{...rows[i],driver_name: "upd sss"});
                const resp= await updateDriverBrandingCardItem(dbcard.crm_card_id,{...rows[i]},isNeededToFinish);

            }


        }
        if(isNeededToFinish) {
            await cleanUpBrandingCards();
            console.log('Branding cards table has been cleaned up.');
        };
    }

}