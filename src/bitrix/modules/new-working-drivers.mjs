import {
    insertNewWorkingDriver,
    getNewWorkingDriverWorked7Days
} from "../bitrix.queries.mjs";
import {
    getNewWorkingDriversByDate,
    getWorkingDriversById
} from "../../web.api/web.api.utlites.mjs";
import {
    createNewWorkingDriverItem,
    changeItemStage
} from "../bitrix.utils.mjs";
import { cityListWithAssignedBy } from "../bitrix.constants.mjs";
import { DateTime } from "luxon";

const param = process.argv.find(arg => arg.startsWith('--manual_date='));
const manualDate = param ? param.split('=')[1] : null;
const entityTypeId = '1110';

function formatCreatedAt(createdAt) {
    return DateTime.fromJSDate(createdAt, { zone: 'UTC' })
        .setZone('Europe/Kyiv')
        .toFormat('yyyy-MM-dd HH:mm:ss');
}

export async function saveNewWorkingDrivers() {

    const date = manualDate || DateTime.now().setZone('Europe/Kyiv').minus({ days: 1 }).toFormat('yyyy-MM-dd');
    console.log({ time: new Date(), date, message: 'saveNewWorkingDrivers' });
    const { rows } = await getNewWorkingDriversByDate({ date });

    for (let driver of rows) {

        const matchingCity = cityListWithAssignedBy.find(city => city.auto_park_id === driver.auto_park_id);

        const { id } = await createNewWorkingDriverItem({
            name: `${driver.first_name} ${driver.last_name}`,
            stageId: 'DT1110_48:NEW',
            city: matchingCity?.supportCityId,
            phone: driver.phone
        })


        await insertNewWorkingDriver({
            ...driver,
            created_at: formatCreatedAt(driver.created_at),
            item_id: id
        });
    }

}

export async function moveNewWorkingDrivers() {
    const date = manualDate || DateTime.now().setZone('Europe/Kyiv').toFormat('yyyy-MM-dd');

    console.log({ time: new Date(), date, message: 'moveNewWorkingDrivers' });

    const { newWorkingDriverWorked7Days } = await getNewWorkingDriverWorked7Days({ date });
    const driversIds = newWorkingDriverWorked7Days.map(driver => driver.driver_id);
    const { rows } = await getWorkingDriversById({ driversIds })

    const newWorkingDriverReadyForMove = newWorkingDriverWorked7Days.map(driver => {
        const stillWorking = rows.some(row => row.id === driver.driver_id);
        return { ...driver, stillWorking };
    }).filter(driver => driver.stillWorking == true);

    for (let driver of newWorkingDriverReadyForMove) {
        const { item_id } = driver

        await changeItemStage({
            referralTypeId: entityTypeId,
            id: item_id,
            stageId: 'DT1110_48:PREPARATION'
        })
    }
}

if (process.env.ENV == "SAVE_NEW_WORKING_DRIVERS") {
    await saveNewWorkingDrivers();
}

if (process.env.ENV == "MOVE_NEW_WORKING") {
    await moveNewWorkingDrivers();
}