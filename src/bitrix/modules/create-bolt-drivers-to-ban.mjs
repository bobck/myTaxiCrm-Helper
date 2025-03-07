import { getBoltDriversToBan } from "../../web.api/web.api.utlites.mjs";
import { nameKeyWords, cityListWithAssignedBy as cityList } from "../bitrix.constants.mjs";
import { createBanBoltDriverCardItem } from "../bitrix.utils.mjs";
import { openSShTunel } from "../../../ssh.mjs";
import { DateTime } from "luxon";

const nameCheck = (full_name) => {
    return full_name
        .split(" ")
        .filter((w) => !nameKeyWords.some((keyWord) => keyWord === w.toLowerCase()))
        .join(" ");
};
function getCityBrandingId(auto_park_id) {
    return cityList.find((obj) => obj.auto_park_id === auto_park_id).brandingId;
}
function computeQueryParams() {
    const today = DateTime.local().startOf("day");

    const lowerBound = today.minus({ days: 8 });
    // Return the dates formatted as ISO strings (YYYY-MM-DD) for PostgreSQL
    return {
        period_from:lowerBound.toISODate(),
        weekNumber: today.weekNumber,
        year: today.year,
    };
}
export const createBoltDriversToBan = async () => {

    const queryParams = await computeQueryParams();
    const { rows } = await getBoltDriversToBan(queryParams);
    console.log(rows);
    if(rows.length === 0) {
        console.error("No any drivers to ban found.");
        return;
    }
    for (const [index,row] of rows.entries()) {
        if(process.env.ENV==="TEST"&&index===Number(process.env.BOLT_DRIVERS_BAN_CARDS)){
            console.log('testing has been ended')
            return ;
        }
        const{driver_id,auto_park_id,full_name,bolt_id,driver_balance}=row;
        const checkedName=nameCheck(full_name);
        const cityId=getCityBrandingId(auto_park_id);
        const isDebtor=Number(driver_balance)<0;
        const debt=isDebtor?String((-1)*driver_balance):"0";
        const card={
            driver_id,
            full_name:checkedName,
            bolt_id,
            cityId,
            debt,
            isDebtor,
        }
        await createBanBoltDriverCardItem(card);


    }
};


if(process.env.ENV==="TEST"){
    console.log(`testing bolt drivers ban cards creation\ncards count :${process.env.BOLT_DRIVERS_BAN_CARDS}`);
    await openSShTunel
    await createBoltDriversToBan();

}
