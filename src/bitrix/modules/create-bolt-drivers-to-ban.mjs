import { getBoltDriversToBan } from "../../web.api/web.api.utlites.mjs";
import { nameKeyWords, cityListWithAssignedBy as cityList } from "../bitrix.constants.mjs";
import { createBanBoltDriverCardItem } from "../bitrix.utils.mjs";

const nameCheck = (full_name) => {
    return full_name
        .split(" ")
        .filter((w) => !nameKeyWords.some((keyWord) => keyWord === w.toLowerCase()))
        .join(" ");
};
function getCityBrandingId(auto_park_id) {
    return cityList.find((obj) => obj.auto_park_id === auto_park_id).brandingId;
}

export const createBoltDriversToBan = async (cardNumber) => {
    const { rows } = await getBoltDriversToBan();
    for (const [index,row] of rows.entries()) {
        if(index===cardNumber){
            return ;
        }

        const cityId=getCityBrandingId(row.auto_park_id);
        const card={
            ...row,
            cityId,
        }
        console.log(index ,card);
        const crmItem= await createBanBoltDriverCardItem(card)
    }
};
