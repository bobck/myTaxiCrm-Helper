import { getBrandingCardsInfo } from "../../web.api/web.api.utlites.mjs";
import { DateTime } from "luxon";
import { getCrmBrandingCardByDriverId, insertBrandingCard, updateBrandingCardByDriverId } from "../bitrix.queries.mjs";
import { createDriverBrandingCardItem, updateDriverBrandingCardItem } from "../bitrix.utils.mjs";
import { cityListWithAssignedBy as cityList } from "../bitrix.constants.mjs";

export function computePeriodBounds() {
    const today = DateTime.local().startOf("day");
    if (today.weekday === 1)
        return {
            lowerBound: today.minus({ days: 8 }).toISODate(),
            upperBound: today.toISODate(),
        };

    const lowerBound = today.minus({ days: today.weekday }).toISODate();

    const upperBound = today.toISODate();

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

    const { rows } = await getBrandingCardsInfo(bounds);

    if (rows.length === 0) {
        console.error("No rows found for branding cards found.");
        return;
    }
    for (const [index, row] of rows.entries()) {
        if (process.env.ENV==="TEST" && index === Number(process.env.BRANDING_CARDS_COUNT)) {
            return;
        }

        const { weekNumber, year } = DateTime.local().startOf("day");
        const dbcard = await getCrmBrandingCardByDriverId({
            ...row,
            weekNumber,
        });
        if (dbcard) {
            console.error(`Present driver card while creating driver_id: ${row.driver_id}`);
        }
        const total_trips = "0";
        const stage_id = `DT1138_62:${computeBrandingCardStage(total_trips)}`;
        const myTaxiDriverUrl = `https://fleets.mytaxicrm.com/${row.auto_park_id}/drivers/${row.driver_id}`;
        const cityBrandingId = getCityBrandingId(row.auto_park_id);
        const card = {
            ...row,
            total_trips,
            stage_id,
            myTaxiDriverUrl,
            cityBrandingId,
            weekNumber,
            year,
        };
        const bitrixResp = await createDriverBrandingCardItem(card);

        await insertBrandingCard(bitrixResp);
    }
}

if(process.env.ENV==="TEST"){
    console.log(`testing driver branding creation\ncards count :${process.env.BRANDING_CARDS_COUNT}`);
    await createDriverBrandingCards();
}
