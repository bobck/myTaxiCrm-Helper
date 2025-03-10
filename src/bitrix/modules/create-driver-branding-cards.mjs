import { getBrandingCardsInfo } from "../../web.api/web.api.utlites.mjs";
import { DateTime } from "luxon";
import {
    createBrandingProcess,
    getCrmBrandingCardByDriverId,
    insertBrandingCard,
} from "../bitrix.queries.mjs";
import { chunkArray, createDriverBrandingCard, createDriverBrandingCardItem } from "../bitrix.utils.mjs";
import { cityListWithAssignedBy as cityList } from "../bitrix.constants.mjs";
import { openSShTunnel } from "../../../ssh.mjs";

export function computePeriodBounds() {
    const today = DateTime.local().startOf("day");

    const lowerBound = today.minus({ days: today.weekday });

    const upperBound = lowerBound.plus({ days: 7 });

    // Return the dates formatted as ISO strings (YYYY-MM-DD) for PostgreSQL
    return {
        lowerBound,
        upperBound,
    };
}

function computeBrandingCardStage(total_trips) {
    let trips = Number(total_trips);
    if (isNaN(trips)) {
        console.error("Trips must be a number");
    }
    if (trips >= 90) {
        return "PREPARATION";
    } else if (trips < 30) {
        return "CLIENT";
    } else {
        return "NEW";
    }
}
function getCityBrandingId(auto_park_id) {
    return cityList.find((obj) => obj.auto_park_id === auto_park_id).brandingId;
}

export async function createDriverBrandingCards() {
    const bounds = computePeriodBounds();
    // const brandingProcess= await createBrandingProcess({
    //     weekNumber:bounds.upperBound.weekNumber,
    //     year:bounds.upperBound.year,
    //     period_from:bounds.lowerBound.toISODate(),
    //     period_to:bounds.upperBound.toISODate(),
    // });
    // const {period_from, period_to} = brandingProcess;
    // console.log({period_from:bounds.lowerBound.toISODate(), period_to:bounds.upperBound.toISODate()})
    const period_from='2025-03-02'
    const period_to='2025-03-09'
    const { rows } = await getBrandingCardsInfo({period_from, period_to});
    if (rows.length === 0) {
        console.error("No rows found for branding cards found.");
        return;
    }

    const chunkedArrays=chunkArray(rows,Number(process.env.CHUNK_SIZE)||7);
    for (const [index,chunkedArray] of chunkedArrays.entries()) {
        console.log(`chunk nr: ${index}, length: ${chunkedArray.length}`);
        if (process.env.ENV==="TEST" && index === Number(process.env.BRANDING_CARDS_BATCHES_COUNT)) {
            return;
        }
        const processedChunkedArray=[];
        for (const chunkedArrayElement of chunkedArray) {

            const {driver_id,driver_name,phone,auto_park_id,total_trips}=chunkedArrayElement;
            const { weekNumber, year } = bounds.upperBound;

            const stage_id = `DT1158_70:${computeBrandingCardStage(total_trips)}`;
            const myTaxiDriverUrl = `https://fleets.mytaxicrm.com/${auto_park_id}/drivers/${driver_id}`;
            const cityBrandingId = getCityBrandingId(auto_park_id);
            const card = {
                driver_id,
                driver_name,
                stage_id,
                phone,
                myTaxiDriverUrl,
                total_trips,
                weekNumber,
                year,
                cityBrandingId,
            };
            processedChunkedArray.push(card);
        }
        await createDriverBrandingCard({cards: processedChunkedArray});



    }

    // console.log(counter);

    // for (const [index, row] of rows.entries()) {
        // if (process.env.ENV==="TEST" && index === Number(process.env.BRANDING_CARDS_COUNT)) {
        //     return;
        // }
        //
        // const {driver_id,driver_name,phone,auto_park_id,total_trips}=row;
        // const { weekNumber, year } = bounds.upperBound;
        //
        // const dbcard = await getCrmBrandingCardByDriverId({
        //     driver_id,
        //     weekNumber,
        //     year,
        // });
        // if (dbcard) {
        //     console.error(`Present driver card while creating driver_id:${driver_id}, year:${year}, weekNumber:${weekNumber}`);
        //     continue;
        // }
        //
        // const stage_id = `DT1138_62:${computeBrandingCardStage(total_trips)}`;
        // const myTaxiDriverUrl = `https://fleets.mytaxicrm.com/${auto_park_id}/drivers/${driver_id}`;
        // const cityBrandingId = getCityBrandingId(auto_park_id);
        // const card = {
        //         driver_id,
        //         driver_name,
        //         stage_id,
        //         phone,
        //         myTaxiDriverUrl,
        //         total_trips,
        //         weekNumber,
        //         year,
        //         cityBrandingId,
        // };
        // const bitrixResp = await createDriverBrandingCardItem(card);
        //
        // await insertBrandingCard({
        //         ...bitrixResp,
        //         branding_process_id:brandingProcess.id
        // });
        //
//
    // }
}

if(process.env.ENV==="TEST"){
    console.log(`testing driver branding creation\nbatches count: ${process.env.BRANDING_CARDS_BATCHES_COUNT}\nchunk size: ${process.env.CHUNK_SIZE}\nestimated maximum cards count: ${Number(process.env.CHUNK_SIZE)*Number(process.env.BRANDING_CARDS_BATCHES_COUNT)}`);
    await openSShTunnel
    await createDriverBrandingCards();

}
