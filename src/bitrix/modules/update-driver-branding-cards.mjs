import { DateTime } from "luxon";
import {
    getBrandingProcessByWeekNumber, getCrmBrandingCardByDriverId, insertBrandingCard, updateBrandingCardByDriverId,
} from "../bitrix.queries.mjs";
import { chunkArray, createBitrixDriverBrandingCards, updateDriverBrandingCardItem } from "../bitrix.utils.mjs";
import { getBrandingCardsInfo } from "../../web.api/web.api.utlites.mjs";
import { openSShTunnel } from "../../../ssh.mjs";


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

export async function updateDriverBrandingCards() {
    const today = DateTime.local().startOf("day").minus({days:2});
    const brandingProcess=await getBrandingProcessByWeekNumber({weekNumber:today.weekNumber, year:today.year});
    const {period_from,period_to,weekNumber,year,id:brandingProcessId}=brandingProcess;
    const { rows } = await getBrandingCardsInfo({
        period_from,
        period_to
    });
    const chunkedArrays=chunkArray(rows,Number(process.env.CHUNK_SIZE)||7);
    for (const [index,chunkedArray] of chunkedArrays.entries()) {
        if (process.env.ENV==="TEST" && index === Number(process.env.BRANDING_CARDS_BATCHES_COUNT)) {
            return;
        }
        const processedChunkedArray=[];
        for (const chunkedArrayElement of chunkedArray) {

            const {driver_id,total_trips}=chunkedArrayElement;


            const dbcard = await getCrmBrandingCardByDriverId({
                driver_id,
                weekNumber,
                year,
                });
            if (!dbcard) {
                console.error(`Absent driver card while updating driver_id: ${driver_id}, year:${year}, weekNumber:${weekNumber} `);
                continue;
            }
            const stage_id = `DT1158_70:${computeBrandingCardStage(total_trips)}`;

            const card = {
                driver_id,
                stage_id,
                total_trips,
            };
            processedChunkedArray.push(card);
        }

        const bitrixResp=await createBitrixDriverBrandingCards({cards: processedChunkedArray});

        for (const bitrixRespElement of bitrixResp) {
            await updateBrandingCardByDriverId({
                ...bitrixRespElement,
                branding_process_id:brandingProcess.id
            });

        }


    }

    console.log(`${rows.length} branding cards updating has been finished.`);

}
if(process.env.ENV==="TEST"){
    console.log(`testing driver branding updating\nbatches count: ${process.env.BRANDING_CARDS_BATCHES_COUNT}\nchunk size: ${process.env.CHUNK_SIZE}\nestimated maximum cards count: ${Number(process.env.CHUNK_SIZE)*Number(process.env.BRANDING_CARDS_BATCHES_COUNT)}`);
    await openSShTunnel
    await updateDriverBrandingCards();
}

