import { getBoltDriversToBan } from "../../web.api/web.api.utlites.mjs";
import { nameKeyWords } from "../bitrix.constants.mjs";

const nameCheck = (full_name) => {
    return full_name
        .split(" ")
        .filter((w) => !nameKeyWords.some((keyWord) => keyWord === w.toLowerCase()))
        .join(" ");
};
export const createBoltDriversToBan = async () => {
    const { rows } = await getBoltDriversToBan();
    rows.forEach((row) => {
        console.log(nameCheck(row.full_name));
    });
};
