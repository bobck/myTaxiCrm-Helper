import {getDriversRides} from "../../web.api/web.api.utlites.mjs";
import {DateTime} from "luxon";

export async function createDriverBrandingCards() {
    const {rows} = await getDriversRides();

    return rows;

}