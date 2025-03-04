import {getBrandingCardsInfo} from "../../web.api/web.api.utlites.mjs";
import { DateTime } from 'luxon';

import {
    getCrmBrandingCardByDriverId,

    insertBrandingCard, updateBrandingCardByDriverId
} from "../bitrix.queries.mjs";
import {createDriverBrandingCardItem, updateDriverBrandingCardItem} from "../bitrix.utils.mjs";



function computePeriodBounds() {
    const today = DateTime.local().startOf('day');
    if(today.weekday===1) return {
            lowerBound:today.minus({days:8}).toISODate(),
            upperBound:today.minus({days:1}).toISODate()
        }


    const lowerBound = today.minus({ days: today.weekday }).toISODate();

    const upperBound = today.toISODate();

    // Return the dates formatted as ISO strings (YYYY-MM-DD) for PostgreSQL
    return {
        lowerBound,
        upperBound
    };
}


function computeBrandingCardStage(total_trips,isNeededToFinish){
    let trips=Number(total_trips);
    if(isNaN(trips)) throw new Error('Trips must be a number');
    if(isNeededToFinish){
        if(trips>=90){
            return 'SUCCESS';
        }
        return 'FAIL';
    }
    if(trips>=90){
        return 'PREPARATION';
    }
    else if(trips<30){
        return 'CLIENT';
    }
    else {
        return 'NEW';
    }
}


export async function createDriverBrandingCards(cardsCount) {

    const bounds=computePeriodBounds();

    const {rows} = await getBrandingCardsInfo(bounds);

    if(rows instanceof Array){
        for(let i=0; i<(cardsCount||rows.length); i++){
            const {weekNumber,year} = DateTime.local().startOf('day');
            const dbcard= await getCrmBrandingCardByDriverId({...rows[i],weekNumber});
            if(!dbcard){

                const total_trips = '0';
                const stage_id=`DT1138_62:${computeBrandingCardStage(total_trips)}`;
                const myTaxiDriverUrl=`https://fleets.mytaxicrm.com/${auto_park_id}/drivers/${driver_id}`

                const card={
                    ...rows[i],
                    total_trips,
                    stage: stage_id,
                    weekNumber,
                    year,
                }
                const bitrixResp=await createDriverBrandingCardItem(card);

                await insertBrandingCard(bitrixResp);
            }
            else throw new Error(`Present driver card while creating driver_id: ${rows[i].driver_id}`);

        }

    }

}


export async function updateDriverBrandingCards(isNeededToFinish,cardsCount) {

    const bounds=computePeriodBounds();

    const {rows} = await getBrandingCardsInfo(bounds);

    if(rows instanceof Array){
        for(let i=0; i<(cardsCount||rows.length); i++){
            const {weekNumber,year} = DateTime.local().startOf('day');

            const dbcard= await getCrmBrandingCardByDriverId({...rows[i],weekNumber});
            if(dbcard){
                if(Number(dbcard.total_trips)<Number(rows[i].total_trips)||isNeededToFinish){
                    const stage=computeBrandingCardStage(rows[i].total_trips, isNeededToFinish);

                    const card={
                        ...rows[i],
                        crm_card_id:dbcard.crm_card_id,
                        stage,
                        weekNumber,
                        year,
                    }
                    console.log(card)
                    const bitrixResp=await updateDriverBrandingCardItem(card);


                    const dbupdate=await updateBrandingCardByDriverId(bitrixResp);


                }

            }
            else throw new Error(`Absent driver card while updating driver_id: ${rows[i].driver_id}`);

        }

    }

}