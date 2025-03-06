import { getBrandingCardsInfo } from "../../web.api/web.api.utlites.mjs";
import { DateTime } from "luxon";
import {
    getBrandingProcessByWeekNumber,
    getCrmBrandingCardByDriverId, resolveBrandingProcessById,
    updateBrandingCardByDriverId,
} from "../bitrix.queries.mjs";
import { updateDriverBrandingCardItem } from "../bitrix.utils.mjs";
import { openSShTunnel } from "../../../ssh.mjs";
import { initApi } from "../../api/endpoints.mjs";
import { pool } from "../../api/pool.mjs";


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
    const today = DateTime.local().startOf("day");
    const brandingProcess=await getBrandingProcessByWeekNumber({weekNumber:today.weekNumber, year:today.year});
    console.log(brandingProcess);
    const { rows } = await getBrandingCardsInfo({
        period_from:brandingProcess.period_from,
        period_to:brandingProcess.period_to
    });


    if (rows.length === 0) {
        console.error("No rows found for branding cards found.");
        return;
    }
    for (const [index, row] of rows.entries()) {
        if (process.env.ENV==="TEST" && index === Number(process.env.BRANDING_CARDS_COUNT)) {
            const resolveResp=await resolveBrandingProcessById(brandingProcess.id);
            console.log(`resolving branding process #${brandingProcess.id}`,resolveResp);
            return;
        }
        const {driver_id,total_trips}=row;
        const { weekNumber, year } = brandingProcess
        const dbcard = await getCrmBrandingCardByDriverId({
            ...row,
            weekNumber,
            year
        });
        if (!dbcard) {
            console.error(`Absent driver card while updating driver_id: ${row.driver_id}`);
        }
        else{

            if (Number(dbcard.total_trips) <= Number(row.total_trips)) {
                const stage_id = `DT1138_62:${computeBrandingCardStage(row.total_trips)}`;

                const card = {
                    driver_id,
                    bitrix_card_id: dbcard.bitrix_card_id,
                    stage_id,
                    total_trips
                };

                const bitrixResp = await updateDriverBrandingCardItem(card);

                const dbupdate = await updateBrandingCardByDriverId({
                    branding_process_id:brandingProcess.id,
                    driver_id,
                    total_trips,
                });
            }
        }

    }
    const resolveResp=await resolveBrandingProcessById(brandingProcess.id);
    console.log(`resolving branding process #${brandingProcess.id}`,resolveResp);
}
if(process.env.ENV==="TEST"){
    console.log(`testing driver branding movement\ncards count :${process.env.BRANDING_CARDS_COUNT}`);
    await openSShTunnel
    await initApi({ pool });
    await moveDriverBrandingCards();
}
