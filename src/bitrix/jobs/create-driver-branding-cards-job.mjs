import {createDriverBrandingCards} from "../modules/create-driver-branding-cards.mjs";
import {
    createDriverBrandingCardItem,
    getCrmItemFields,
    getListElementsByIblockId,
    updateDriverBrandingCardItem
} from "../bitrix.utils.mjs";
import {list_188} from "../bitrix.constants.mjs";

export const createDriverBrandingCardsJob= async () => {
    try {
        const cards2Upload=2;
        const cards= await createDriverBrandingCards();
        const cardIds=[];
        //coincidence check by city name mistakes
        const set= new Set();
        cards.forEach((card) => {if(!list_188.some((obj)=>card.city===obj.city)) set.add(card.city)});
        if(set.size)
            throw new Error(`some cities hasn't assigned ids such as : ${Array.from(set).reduce((acc,curr) =>`"${curr}" ${acc}`,'')}`);

        for (let i=0; i<cards2Upload; i++){

            cardIds.push(await createDriverBrandingCardItem(cards[i]));

        }
        console.log(cardIds);
        // await updateDriverBrandingCardItem();
        // const responce=await getCrmItemFields(1138);
        // console.log(responce.result.fields.stageId);
        // const resp2=await getListElementsByIblockId(188);

    } catch (error) {
        console.error('Error occurred in onTick on moveReferralToClosed');
        console.error({ time: new Date(), error });
    }
}