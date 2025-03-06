import { getBrandingCardsInfo } from "../../web.api/web.api.utlites.mjs";
import { DateTime } from "luxon";
import {
    createBrandingProcess,
    getCrmBrandingCardByDriverId,
    insertBrandingCard,
} from "../bitrix.queries.mjs";
import { createDriverBrandingCardItem } from "../bitrix.utils.mjs";
import { cityListWithAssignedBy as cityList } from "../bitrix.constants.mjs";
import { openSShTunnel } from "../../../ssh.mjs";
import { initApi } from "../../api/endpoints.mjs";
import { pool } from "../../api/pool.mjs";

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
    const brandingProcess= await createBrandingProcess({
        weekNumber:bounds.upperBound.weekNumber,
        year:bounds.upperBound.year,
        period_from:bounds.lowerBound.toISODate(),
        period_to:bounds.upperBound.toISODate(),
    });
    const {period_from, period_to} = brandingProcess;
    const { rows } = await getBrandingCardsInfo({period_from, period_to});

    if (rows.length === 0) {
        console.error("No rows found for branding cards found.");
        return;
    }
    for (const [index, row] of rows.entries()) {
        if (process.env.ENV==="TEST" && index === Number(process.env.BRANDING_CARDS_COUNT)) {
            return;
        }

        const {driver_id,driver_name,phone,auto_park_id,total_trips}=row;
        const { weekNumber, year } = bounds.upperBound;

        const dbcard = await getCrmBrandingCardByDriverId({
            driver_id,
            weekNumber,
            year,
        });
        if (dbcard) {
            console.error(`Present driver card while creating driver_id:${driver_id}`);
        }
        else{
            const stage_id = `DT1138_62:${computeBrandingCardStage(total_trips)}`;
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
            const bitrixResp = await createDriverBrandingCardItem(card);

            await insertBrandingCard({
                ...bitrixResp,
                branding_process_id:brandingProcess.id
            });
        }

    }
}

if(process.env.ENV==="TEST"){
    console.log(`testing driver branding creation\ncards count :${process.env.BRANDING_CARDS_COUNT}`);
    await openSShTunnel
    await initApi({ pool });
    await createDriverBrandingCards();

}
