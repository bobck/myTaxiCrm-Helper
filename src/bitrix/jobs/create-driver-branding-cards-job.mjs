import {createDriverBrandingCards} from "../modules/create-driver-branding-cards.mjs";
import {
    createDriverBrandingCardItem,
    getCrmItemFields,
    getListElementsByIblockId,
    updateDriverBrandingCardItem
} from "../bitrix.utils.mjs";
import {list_188} from "../bitrix.constants.mjs";
import {
    getCrmBrandingItem,



    insertBrandingCard
} from "../bitrix.queries.mjs";


export const createDriverBrandingCardsJob= async () => {
    try {

        const cards2Upload=20;
        const cards= await createDriverBrandingCards();


        //coincidence check by city name mistakes
        const set= new Set();
        cards.forEach((card) => {if(!list_188.some((obj)=>card.city===obj.city)) set.add(card.city)});
        if(set.size)
            throw new Error(`some cities hasn't assigned ids such as : ${Array.from(set).reduce((acc,curr) =>`"${curr}" ${acc}`,'')}`);

        for (let i=0; i<cards2Upload; i++){

            let dbcard=await getCrmBrandingItem(cards[i]);
            console.log(dbcard?`crmBrandingItem${dbcard.driver_id} already exists`:`crmBrandingItem${cards[i].driver_id}doesnt exist`);
            if(!dbcard){
                await insertBrandingCard(await createDriverBrandingCardItem(cards[i]));
                dbcard=await getCrmBrandingItem(cards[i]);
            }
            if(dbcard){
                // const resp= await updateDriverBrandingCardItem(dbcard.crm_card_id,{...cards[i],driver_name: "upd sss"});
                const resp= await updateDriverBrandingCardItem(dbcard.crm_card_id,{...cards[i]});

            }

            console.log(dbcard);
        }



    } catch (error) {
        console.error('Error occurred in onTick on moveReferralToClosed');
        console.error({ time: new Date(), error });
    }
}