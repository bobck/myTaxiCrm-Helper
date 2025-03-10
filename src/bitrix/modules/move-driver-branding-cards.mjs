import { getBrandingCardsInfo } from "../../web.api/web.api.utlites.mjs";
import { DateTime } from "luxon";
import {
    getBrandingProcessByWeekNumber,
    getCrmBrandingCardByDriverId, resolveBrandingProcessById,
    updateBrandingCardByDriverId,
} from "../bitrix.queries.mjs";
import { chunkArray, updateBitrixDriverBrandingCards } from "../bitrix.utils.mjs";
import { openSShTunnel } from "../../../ssh.mjs";


function computeBrandingCardStage(total_trips) {
    let trips = Number(total_trips);
    if (isNaN(trips)) {
        console.error("Trips must be a number");
    }
    if (trips >= 90) {
        return "SUCCESS";
    }
    else {
        return "FAIL";
    }
}

export async function moveDriverBrandingCards() {
    const yesterday = DateTime.local().startOf("day").minus({days: 1});
    const brandingProcess=await getBrandingProcessByWeekNumber({weekNumber:yesterday.weekNumber, year:yesterday.year});
    const {period_from,period_to,weekNumber,year,id:brandingProcessId}=brandingProcess;
    const { rows } = await getBrandingCardsInfo({
        period_from,
        period_to
    });
    const processedCards=[];

    for (const [index, row] of rows.entries()) {
        if (process.env.ENV==="TEST" && index === Number(process.env.BRANDING_CARDS_COUNT)) {
            break;
        }
        const {driver_id,total_trips}=row;
        const { weekNumber, year } = brandingProcess
        const dbcard = await getCrmBrandingCardByDriverId({
            driver_id,
            weekNumber,
            year
        });
        if (!dbcard) {
            console.error(`Absent driver card while updating driver_id: ${driver_id}, year:${year}, weekNumber:${weekNumber} `);
            continue;
        }


        const stage_id = `DT1158_70:${computeBrandingCardStage(total_trips)}`;

        const card = {
            driver_id,
            bitrix_card_id: dbcard.bitrix_card_id,
            stage_id,
            total_trips
        };
        processedCards.push(card);
    }

    const chunkedProcessedCards = chunkArray(processedCards,Number(process.env.CHUNK_SIZE)||7);

    for (const [index, chunk] of chunkedProcessedCards.entries()) {

        const bitrixRespArr=await updateBitrixDriverBrandingCards({cards:chunk});

        for (const respElement of bitrixRespArr) {
            const {driver_id,total_trips}=respElement;

            const dbupdate = await updateBrandingCardByDriverId({
                branding_process_id:brandingProcess.id,
                driver_id,
                total_trips,
            });
        }

    }

    console.log(`${rows.length} branding cards updating has been finished.`);

    const resolveResp=await resolveBrandingProcessById(brandingProcess.id);
    console.log(`Resolved resp: `,resolveResp);
}
if(process.env.ENV==="TEST"){
    console.log(`testing driver branding movement\ncards count :${process.env.BRANDING_CARDS_COUNT}`);
    await openSShTunnel
    await moveDriverBrandingCards();
}
