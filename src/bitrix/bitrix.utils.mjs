import { Bitrix, Method } from '@2bad/bitrix'
import fs from 'fs'
import { pool } from './../api/pool.mjs'

const bitrix = Bitrix(`https://${process.env.BITRIX_PORTAL_HOST}/rest/${process.env.BITRIX_USER_ID}/${process.env.BITRIX_API_KEY}/`)

export async function getFreshFiredDrivers({ unixCreatedAt }) {
    const sql = fs.readFileSync('./src/sql/fired_out_drivers_for_bitrix.sql').toString();

    const result = await pool.query(sql, [unixCreatedAt])
    const { rows, rowCount } = result
    return { rows }
}

export async function createDeal({ title, name, phone, cityId, firedReason, ridesCount, assignedBy, workedDays, contactId }) {

    const response = await bitrix.deals.create({
        TITLE: title,
        CATEGORY_ID: process.env.FIRED_CATEGORY_ID,
        STAGE_ID: process.env.FIRED_STAGE_ID,
        UF_CRM_1714048934703: name,
        UF_CRM_1627379978: [phone],
        UF_CRM_1527615815: cityId,
        UF_CRM_1714048836815: firedReason,
        UF_CRM_1714048883273: ridesCount,
        ASSIGNED_BY_ID: assignedBy,
        SOURCE_ID: process.env.FIRED_SOURCE_ID,
        UF_CRM_1714568766491: workedDays,
        CONTACT_ID: contactId
    })
    const { result } = response
    return result
}

export const cityListWithAssignedBy = [
    { 'assignedBy': '50222', 'auto_park_id': 'e4df553f-4ec2-43a8-b012-4795259e983a', 'cityId': '91', 'cityName': 'Київ' },
    { 'assignedBy': '50222', 'auto_park_id': '5571b3ea-1ccf-4f41-bbe0-0f12ee8dfb17', 'cityId': '91', 'cityName': 'Київ usa' },
    { 'assignedBy': '106546', 'auto_park_id': '052da49c-2175-4033-8010-c8e1f9a755ab', 'cityId': '93', 'cityName': 'Харків' },
    { 'assignedBy': '46926', 'auto_park_id': '03328f6b-1336-4ee3-8407-bf5520411136', 'cityId': '95', 'cityName': 'Одеса' },
    { 'assignedBy': '50222', 'auto_park_id': '2964e082-0e86-4695-b5f5-98915d190518', 'cityId': '97', 'cityName': 'Дніпро' },
    { 'assignedBy': '106546', 'auto_park_id': 'a7bb17b7-fc87-4617-a915-d2f9ec83cfa0', 'cityId': '99', 'cityName': 'Львів' },
    { 'assignedBy': '50222', 'auto_park_id': '2d3e566e-01a2-486f-ac7f-446d13f96f27', 'cityId': '101', 'cityName': 'Запоріжжя' },
    { 'assignedBy': '46926', 'auto_park_id': '2bfb0c23-33d8-4bc3-ab03-442d6ba13712', 'cityId': '209', 'cityName': 'Вінниця' },
    { 'assignedBy': '46926', 'auto_park_id': 'ff2368ca-dce1-4315-af7b-9850056ab3ce', 'cityId': '223', 'cityName': 'Чернігів' },
    { 'assignedBy': '46926', 'auto_park_id': 'b0328dc5-71be-485d-b6ec-786d9ce52112', 'cityId': '225', 'cityName': 'Суми' },
    { 'assignedBy': '106546', 'auto_park_id': '4dd93df2-c172-488c-846f-d81452ddba70', 'cityId': '227', 'cityName': 'Полтава' },
    { 'assignedBy': '50222', 'auto_park_id': '472c4d3e-3fe7-45ea-9c94-a77f364bbd86', 'cityId': '241', 'cityName': 'Івано-Франківськ' },
    { 'assignedBy': '106546', 'auto_park_id': 'eef0dbe4-38f8-4299-95e2-25586bb02a38', 'cityId': '369', 'cityName': 'Кривий Ріг' },
    { 'assignedBy': '46926', 'auto_park_id': '2f4c5352-0296-4fba-859b-9f8955f3f2a0', 'cityId': '397', 'cityName': 'Хмельницький' },
    { 'assignedBy': '106546', 'auto_park_id': 'c6dc6608-1cb3-488d-97f6-3f1132732bb9', 'cityId': '399', 'cityName': 'Житомир' },
    { 'assignedBy': '46926', 'auto_park_id': '34a2020d-d412-461c-ba0a-86e45f9afc78', 'cityId': '401', 'cityName': 'Рівне' },
    { 'assignedBy': '50222', 'auto_park_id': 'd34e7c17-ccf3-49d1-875c-67e4378c4562', 'cityId': '403', 'cityName': 'Чернівці' },
    { 'assignedBy': '50222', 'auto_park_id': 'c41e490d-7722-4f74-b884-6a169143b132', 'cityId': '403', 'cityName': 'Чернівці usa' },
    { 'assignedBy': '50222', 'auto_park_id': '9c8bae55-2aa2-4b25-a1e0-c93ab4bbb3ad', 'cityId': '405', 'cityName': 'Тернопіль' },
    { 'assignedBy': '46926', 'auto_park_id': '6897e6f0-b33d-405a-b110-8c623c864cfc', 'cityId': '409', 'cityName': 'Луцьк' },
    { 'assignedBy': '106546', 'auto_park_id': 'd78cf363-5b82-41b2-8a53-79bb74969ba7', 'cityId': '413', 'cityName': 'Ужгород' },
    { 'assignedBy': '106546', 'auto_park_id': 'df5ddf9d-f6f5-45d1-b7a4-346852f65b12', 'cityId': '413', 'cityName': 'Ужгород usa' },
    { 'assignedBy': '106546', 'auto_park_id': 'ee12f8cd-570e-4eab-8ec8-1ead1c619bb7', 'cityId': '467', 'cityName': 'Черкаси' },
    { 'assignedBy': '46926', 'auto_park_id': '65844e7d-5e8a-4582-9ac3-c8cdaa988726', 'cityId': '469', 'cityName': 'Каменець-Подільский' },
    { 'assignedBy': '106546', 'auto_park_id': '45dcaa21-bceb-45f2-bba9-5c72bbac441f', 'cityId': '1362', 'cityName': 'Мукачево' },
    { 'assignedBy': '106546', 'auto_park_id': '2a76a356-8b99-4650-83c0-d0ad84d2c004', 'cityId': '1362', 'cityName': 'Мукачево usa' }
]

export async function findContactByPhone({ phone }) {
    const response = await bitrix.call('crm.contact.list', {
        filter: { 'PHONE': phone },
        select: ['ID', 'NAME', 'PHONE']
    });

    const { result } = response

    if (result.length > 0) {
        const [firstContact] = result
        return firstContact.ID;
    } else {
        return null;
    }
}

export async function findContactsByPhones({ drivers }) {

    let batchArray = []

    for (let driver of drivers) {
        const params = {
            'entity_type': 'CONTACT',
            'type': 'PHONE',
            'values[]': driver.phone
        }
        batchArray.push({ method: 'crm.duplicate.findbycomm', params })
    }
    const { result, time } = await bitrix.batch(batchArray)

    return result
}

export async function findDealByContact({ drivers, category_id }) {

    let batchObj = {}

    for (let driver of drivers) {
        const contacts = JSON.parse(driver.contacts_array);
        for (let contact of contacts) {
            const params = {
                'filter[CATEGORY_ID]': category_id,
                'filter[CONTACT_ID]': contact,
                'select[]': 'ID',
                'order[DATE_CREATE]': 'ASC'
            }
            batchObj[contact] = { method: Method.CRM_DEAL_LIST, params }
        }
    }

    const { result, time } = await bitrix.batch(batchObj)

    return result
}

export async function updateDealsOpportunity({ drivers }) {

    let batchObj = {}

    for (let driver of drivers) {
        const { deal_id, auto_park_revenue } = driver
        const params = {
            'ID': deal_id,
            'fields[OPPORTUNITY]': auto_park_revenue
        }
        batchObj[deal_id] = { method: Method.CRM_DEAL_UPDATE, params }
    }

    const { result, time } = await bitrix.batch(batchObj)
    return result
}

export function chunkArray(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}

export async function getLeadsByCreateDateAndAssigned({ date, assigned }) {

    const response = await bitrix.leads.list({
        filter: {
            '>=DATE_CREATE': `${date}T00:00:00`,
            '<=DATE_CREATE': `${date}T23:59:59`,
            'ASSIGNED_BY_ID': assigned
        },
        select: ['ID', 'SOURCE_ID', 'UF_CRM_1688301710585', 'UF_CRM_1526673568']
    });

    const { result } = response
    return result
}

export async function getLeadsByCreateDateAndSourceId({ date, sourceId }) {

    const response = await bitrix.leads.list({
        filter: {
            '>=DATE_CREATE': `${date}T00:00:00`,
            '<=DATE_CREATE': `${date}T23:59:59`,
            'SOURCE_ID': sourceId
        },
        select: ['ID', 'SOURCE_ID', 'UF_CRM_1688301710585', 'UF_CRM_1526673568']
    });

    const { result } = response
    return result
}

export async function getDealsByInterviewDate({ date }) {

    const response = await bitrix.deals.list({
        filter: {
            '>=UF_CRM_1608302466359': `${date}T00:00:00`,
            '<=UF_CRM_1608302466359': `${date}T23:59:59`,
            'CATEGORY_ID': '3'
        },
        select: ['ID', 'SOURCE_ID', 'STAGE_ID', 'UF_CRM_1527615815', 'UF_CRM_1722203030883']
    });

    const { result } = response
    return result
}

export async function getDealsByClosedDate({ date }) {

    const response = await bitrix.deals.list({
        filter: {
            '>=CLOSEDATE': `${date}T00:00:00`,
            '<=CLOSEDATE': `${date}T23:59:59`,
            'CATEGORY_ID': '3',
            'CLOSED': 'Y'
        },
        select: ['ID', 'SOURCE_ID', 'STAGE_ID', 'UF_CRM_1527615815', 'UF_CRM_1725629985727']
    });

    const { result } = response
    return result
}

export async function getDealsRescheduled() {

    const response = await bitrix.deals.list({
        filter: {
            'CATEGORY_ID': '3',
            'STAGE_ID': 'C3:5'
        },
        select: ['ID', 'SOURCE_ID', 'UF_CRM_1527615815']
    });

    const { result } = response
    return result
}

export async function getManifoldDeals() {

    const response = await bitrix.deals.list({
        filter: {
            'CATEGORY_ID': '42'
        },
        select: ['*']
    });

    const { result } = response
    return result
}

export async function getDeals({ ids }) {

    let batchObj = {}

    for (let id of ids) {
        const params = {
            'ID': id,
        }
        batchObj[id] = { method: Method.CRM_DEAL_GET, params }
    }

    const { result, time } = await bitrix.batch(batchObj)
    return result
}


export async function getContacts({ ids }) {

    let batchObj = {}

    for (let id of ids) {
        const params = {
            'ID': id,
        }
        batchObj[id] = { method: Method.CRM_CONTACT_GET, params }
    }

    const { result, time } = await bitrix.batch(batchObj)
    return result
}

export async function deleteBitrixTaskById({ task_id }) {
    try {

        const response = await bitrix.call('tasks.task.delete', {
            taskId: task_id
        });
        const { result } = response
        const { task } = result

        if (!task) {
            throw { message: 'Task not found', task_id }
        }

        return task

    } catch (e) {
        console.error({ message: 'Unable to delete task', task_id })
    }
}

export async function completeBitrixTaskById({ task_id }) {
    try {

        const response = await bitrix.call('tasks.task.complete', {
            taskId: task_id
        });

        const { result } = response
        const { task } = result

        if (!task) {
            throw { message: 'Task not found', task_id }
        }

        return task

    } catch (e) {
        console.error({ message: 'Unable to complete task', task_id })
    }
}

export async function addCommentToDeal({ deal_id, comment }) {
    try {

        const response = await bitrix.call('crm.timeline.comment.add', {
            'fields[ENTITY_ID]': deal_id,
            'fields[ENTITY_TYPE]': 'deal',
            'fields[COMMENT]': comment
        });

        return response
    } catch (e) {
        console.error({ message: 'Unable to create comment', deal_id })
    }
}

export async function createPayment({
    title,
    stageId,
    city,
    contactId,
    assignedBy,
    referrerPhone,
    referrerName,
    referrerPosition
}) {

    const response = await bitrix.call('crm.item.add', {
        'entityTypeId': '1102',
        'fields[title]': title,
        'fields[STAGE_ID]': stageId,
        'fields[ufCrm38_1728384234]': city,
        'fields[CONTACT_ID]': contactId,
        'fields[ASSIGNED_BY_ID]': assignedBy,
        'fields[ufCrm38_1727460853]': referrerPhone,
        'fields[ufCrm38_1727460831]': referrerName,
        'fields[ufCrm38_1727460760]': referrerPosition
    });
    const { result } = response
    const { item } = result
    const { id } = item
    return { id }

}

export async function addCommentToEntity({ entityId, typeId, comment }) {

    const response = await bitrix.call('crm.timeline.comment.add', {
        'fields[ENTITY_ID]': entityId,
        'fields[ENTITY_TYPE]': `DYNAMIC_${typeId}`,
        'fields[COMMENT]': comment
    });

    const { result } = response
    return { result }
}