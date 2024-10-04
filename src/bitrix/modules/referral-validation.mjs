import {
    deleteBitrixTaskById,
    completeBitrixTaskById
} from "../bitrix.utils.mjs";
import { getDriverByContract } from "../../web.api/web.api.utlites.mjs";
import { message } from "telegraf/filters";

export async function referralValidadion(params) {
    const { task_id, doc_id, first_name, last_name, contract, deal_id } = params;

    if (!doc_id || !first_name || !last_name || !contract || !deal_id) {

        if (task_id) {
            console.log({ task_id, message: 'delete by missing paramets' })
            await deleteBitrixTaskById({ task_id });
            return
        }

        console.log({ message: 'delete by missing paramets' })
        return
    }

    const { rows } = await getDriverByContract({ contract })

    if (rows.length != 1) {
        console.log({ task_id, message: 'delete by multiple drivers' })
        await deleteBitrixTaskById({ task_id });
        return
    }

    const [driver] = rows;

    const {
        first_name: crm_first_name,
        last_name: crm_last_name,
        doc_id: crm_doc_id,
        auto_park_id,
        id
    } = driver

    if (last_name != crm_last_name || first_name != crm_first_name) {
        console.log({ task_id, message: 'delete by wrong name' })
        await deleteBitrixTaskById({ task_id });
        return
    }

    if (doc_id != crm_doc_id) {
        console.log({ task_id, message: 'delete by wrong doc_id' })
        await deleteBitrixTaskById({ task_id });
        return
    }
    
    //save fer to DB
    await completeBitrixTaskById({ task_id });
}