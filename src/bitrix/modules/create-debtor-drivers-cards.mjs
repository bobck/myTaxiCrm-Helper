import { getBrandingCardsInfo, getFiredDebtorDriversInfo } from "../../web.api/web.api.utlites.mjs";
import { DateTime } from "luxon";
import {
    createBrandingProcess,
    getCrmBrandingCardByDriverId,
    insertBrandingCard,
} from "../bitrix.queries.mjs";
import { createDriverBrandingCardItem } from "../bitrix.utils.mjs";
import { cityListWithAssignedBy as cityList } from "../bitrix.constants.mjs";
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
function getCityBrandingId(auto_park_id) {
    return cityList.find((obj) => obj.auto_park_id === auto_park_id).brandingId;
}

export async function createFiredDebtorDriversCards() {

    const { rows } = await getFiredDebtorDriversInfo();

    if (rows.length === 0) {
        console.error("No rows found for fired debtor drivers found.");
        return;
    }
    console.log('rows.length: ',rows.length);
    for (const [index, row] of rows.entries()) {
        if (process.env.ENV==="TEST" && index === Number(process.env.DEBTOR_DRIVERS_CARDS_COUNT=4)) {
            return;
        }

        const {}=row;
        console.log(index,row)

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
        //     driver_id,
        //     driver_name,
        //     stage_id,
        //     phone,
        //     myTaxiDriverUrl,
        //     total_trips,
        //     weekNumber,
        //     year,
        //     cityBrandingId,
        // };
        // const bitrixResp = await createDriverBrandingCardItem(card);
        //
        // await insertBrandingCard({
        //     ...bitrixResp,
        //     branding_process_id:brandingProcess.id
        // });


    }
}

if(process.env.ENV==="TEST"){
    console.log(`testing fired debtor drivers creation\ncards count :${process.env.DEBTOR_DRIVERS_CARDS_COUNT=4}`);
    await openSShTunnel
    await createFiredDebtorDriversCards();

}
