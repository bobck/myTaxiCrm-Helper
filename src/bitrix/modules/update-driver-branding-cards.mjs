import { getBrandingCardsInfo } from "../../web.api/web.api.utlites.mjs";
import { DateTime } from "luxon";
import { getCrmBrandingCardByDriverId, updateBrandingCardByDriverId } from "../bitrix.queries.mjs";
import { updateDriverBrandingCardItem } from "../bitrix.utils.mjs";
import { computePeriodBounds, createDriverBrandingCards } from "./create-driver-branding-cards.mjs";

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
        if (!dbcard) {
            console.error(`Absent driver card while updating driver_id: ${row.driver_id}`);
        }

        if (Number(dbcard.total_trips) < Number(row.total_trips)) {
            const stage_id = `DT1138_62:${computeBrandingCardStage(row.total_trips)}`;

            const card = {
                ...row,
                bitrix_card_id: dbcard.bitrix_card_id,
                stage_id,
                weekNumber,
                year,
            };

            const bitrixResp = await updateDriverBrandingCardItem(card);

            const dbupdate = await updateBrandingCardByDriverId(bitrixResp);
        }
    }
}
if(process.env.ENV==="TEST"){
    console.log(`testing driver branding updating\ncards count :${process.env.BRANDING_CARDS_COUNT}`);
    await updateDriverBrandingCards();
}

