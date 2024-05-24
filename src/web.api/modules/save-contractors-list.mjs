import { getContractorsList } from "../web.api.utlites.mjs";
import { insertContractors, getContractorIdByName } from "../web.api.queries.mjs";

export async function saveContractorsList() {
    const { contractorsList } = await getContractorsList();
    await insertContractors(contractorsList);
}


if (process.env.ENV == "TEST") {
    saveContractorsList();
}