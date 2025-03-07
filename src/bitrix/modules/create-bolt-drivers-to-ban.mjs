import { getBoltDriversToBan } from "../../web.api/web.api.utlites.mjs";
import { nameKeyWords, cityListWithAssignedBy as cityList } from "../bitrix.constants.mjs";
import { createBanBoltDriverCardItem } from "../bitrix.utils.mjs";
import { openSShTunel } from "../../../ssh.mjs";

const nameCheck = (full_name) => {
    return full_name
        .split(" ")
        .filter((w) => !nameKeyWords.some((keyWord) => keyWord === w.toLowerCase()))
        .join(" ");
};
function getCityBrandingId(auto_park_id) {
    return cityList.find((obj) => obj.auto_park_id === auto_park_id).brandingId;
}

export const createBoltDriversToBan = async () => {
    const { rows } = await getBoltDriversToBan();
    if(rows.length === 0) {
        console.error("No any drivers to ban found.");
        return;
    }
    for (const [index,row] of rows.entries()) {
        if(process.env.ENV==="TEST"&&index===Number(process.env.BOLT_DRIVERS_BAN_CARDS)){
            console.log('testing has been ended')
            return ;
        }
        const{driver_id,auto_park_id,full_name,bolt_id,total_balance}=row;
        const checkedName=nameCheck(full_name);
        const cityId=getCityBrandingId(auto_park_id);
        const card={
            driver_id,
            full_name:checkedName,
            bolt_id,
            cityId,
            total_balance:total_balance||0,
            isDebtor:!(total_balance===undefined||Number(total_balance)<0),
        }
        console.log(index ,card);
        const crmItem= await createBanBoltDriverCardItem(card)
    }
};


if(process.env.ENV==="TEST"){
    console.log(`testing bolt drivers ban cards creation\ncards count :${process.env.BOLT_DRIVERS_BAN_CARDS}`);
    await openSShTunel
    await createBoltDriversToBan();

}
