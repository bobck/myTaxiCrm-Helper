import { Bitrix } from '@2bad/bitrix'
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