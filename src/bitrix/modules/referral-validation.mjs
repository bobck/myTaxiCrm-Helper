import {
    deleteBitrixTaskById,
    addCommentToDeal
} from "../bitrix.utils.mjs";
import { getDriverByContract } from "../../web.api/web.api.utlites.mjs";

const cyrillicToLatinMap = {
    'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O',
    'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X'
};

function transliterate(text) {
    return text.split('').map(char => cyrillicToLatinMap[char] || char).join('');
}

export async function referralValidadion(params) {
    const { task_id, doc_id, first_name, last_name, contract, deal_id, contact_id } = params;

    if (!doc_id || !first_name || !last_name || !contract || !deal_id || !contact_id) {

        if (task_id) {
            console.log({ task_id, message: 'delete by missing paramets' })
            await deleteBitrixTaskById({ task_id });
        }

        await addCommentToDeal({ deal_id, comment: 'Відмовлено у рефелальній програмі. Недостатньо данних' });
        return false
    }

    const { rows } = await getDriverByContract({ contract: contract.replace(/\s+/g, '') })

    if (rows.length == 0) {
        console.log({ task_id, message: 'delete by no drivers found' })
        await addCommentToDeal({ deal_id, comment: `Відмовлено у рефелальній програмі. Не знайдено водія з номером договора ${contract}` });
        await deleteBitrixTaskById({ task_id });
        return false
    }

    if (rows.length > 1) {
        console.log({ task_id, message: 'delete by multiple drivers' })
        await addCommentToDeal({ deal_id, comment: `Відмовлено у рефелальній програмі. Забагато водіїв з номеров договора ${contract}` });
        await deleteBitrixTaskById({ task_id });
        return false
    }

    const [driver] = rows;

    const {
        first_name: crm_first_name,
        last_name: crm_last_name,
        driver_license_number,
        auto_park_id,
        id
    } = driver

    if (last_name != crm_last_name || first_name != crm_first_name) {
        console.log({ task_id, message: 'delete by wrong name' })
        await addCommentToDeal({ deal_id, comment: `Відмовлено у рефелальній програмі. ПІБ не співпадає з MyTaxiCRM` });
        await deleteBitrixTaskById({ task_id });
        return false
    }

    if (transliterate(doc_id.replace(/\s+/g, '')) != transliterate(driver_license_number)) {
        console.log({ task_id, message: 'delete by wrong doc_id' })
        await addCommentToDeal({ deal_id, comment: `Відмовлено у рефелальній програмі. Серія та номер прав не співпадає з MyTaxiCRM` });
        await deleteBitrixTaskById({ task_id });
        return false
    }

    return {
        auto_park_id,
        id
    }
}