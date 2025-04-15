import { Bitrix, Method } from '@2bad/bitrix';
import fs from 'fs';
import { pool } from './../api/pool.mjs';
const bitrix = Bitrix(
  `https://${process.env.BITRIX_PORTAL_HOST}/rest/${process.env.BITRIX_USER_ID}/${process.env.BITRIX_API_KEY}/`
);

export async function getFreshFiredDrivers({ unixCreatedAt }) {
  const sql = fs
    .readFileSync('./src/sql/fired_out_drivers_for_bitrix.sql')
    .toString();

  const result = await pool.query(sql, [unixCreatedAt]);
  const { rows, rowCount } = result;
  return { rows };
}
export async function createDeal({
  title,
  name,
  phone,
  cityId,
  firedReason,
  ridesCount,
  assignedBy,
  workedDays,
  contactId,
}) {
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
    CONTACT_ID: contactId,
  });
  const { result } = response;
  return result;
}

export async function findContactByPhone({ phone }) {
  const response = await bitrix.call('crm.contact.list', {
    filter: { PHONE: phone },
    select: ['ID', 'NAME', 'PHONE'],
  });

  const { result } = response;

  if (result.length > 0) {
    const [firstContact] = result;
    return firstContact.ID;
  } else {
    return null;
  }
}

export async function findContactsByPhones({ drivers }) {
  let batchArray = [];

  for (let driver of drivers) {
    const params = {
      entity_type: 'CONTACT',
      type: 'PHONE',
      'values[]': driver.phone,
    };
    batchArray.push({ method: 'crm.duplicate.findbycomm', params });
  }
  const { result, time } = await bitrix.batch(batchArray);

  return result;
}

export async function findDealByContact({ drivers, category_id }) {
  let batchObj = {};

  for (let driver of drivers) {
    const contacts = JSON.parse(driver.contacts_array);
    for (let contact of contacts) {
      const params = {
        'filter[CATEGORY_ID]': category_id,
        'filter[CONTACT_ID]': contact,
        'select[]': 'ID',
        'order[DATE_CREATE]': 'ASC',
      };
      batchObj[contact] = { method: Method.CRM_DEAL_LIST, params };
    }
  }

  const { result, time } = await bitrix.batch(batchObj);

  return result;
}

export async function updateDealsOpportunity({ drivers }) {
  let batchObj = {};

  for (let driver of drivers) {
    const { deal_id, auto_park_revenue } = driver;
    const params = {
      ID: deal_id,
      'fields[OPPORTUNITY]': auto_park_revenue,
    };
    batchObj[deal_id] = { method: Method.CRM_DEAL_UPDATE, params };
  }

  const { result, time } = await bitrix.batch(batchObj);
  return result;
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
      ASSIGNED_BY_ID: assigned,
    },
    select: ['ID', 'SOURCE_ID', 'UF_CRM_1688301710585', 'UF_CRM_1526673568'],
  });

  const { result } = response;
  return result;
}

export async function getLeadsByCreateDateAndSourceId({ date, sourceId }) {
  const response = await bitrix.leads.list({
    filter: {
      '>=DATE_CREATE': `${date}T00:00:00`,
      '<=DATE_CREATE': `${date}T23:59:59`,
      SOURCE_ID: sourceId,
    },
    select: ['ID', 'SOURCE_ID', 'UF_CRM_1688301710585', 'UF_CRM_1526673568'],
  });

  const { result } = response;
  return result;
}

export async function getDealsByInterviewDate({ date, CATEGORY_ID }) {
  const response = await bitrix.deals.list({
    filter: {
      '>=UF_CRM_1608302466359': `${date}T00:00:00`,
      '<=UF_CRM_1608302466359': `${date}T23:59:59`,
      CATEGORY_ID: CATEGORY_ID,
    },
    select: [
      'ID',
      'SOURCE_ID',
      'STAGE_ID',
      'UF_CRM_1527615815',
      'UF_CRM_1722203030883',
    ],
  });

  const { result } = response;
  return result;
}

export async function getDealsByClosedDate({ date }) {
  const response = await bitrix.deals.list({
    filter: {
      '>=CLOSEDATE': `${date}T00:00:00`,
      '<=CLOSEDATE': `${date}T23:59:59`,
      CATEGORY_ID: '3',
      CLOSED: 'Y',
    },
    select: [
      'ID',
      'SOURCE_ID',
      'STAGE_ID',
      'UF_CRM_1527615815',
      'UF_CRM_1725629985727',
    ],
  });

  const { result } = response;
  return result;
}

export async function getDealsRescheduled() {
  const response = await bitrix.deals.list({
    filter: {
      CATEGORY_ID: '3',
      STAGE_ID: 'C3:5',
    },
    select: ['ID', 'SOURCE_ID', 'UF_CRM_1527615815'],
  });

  const { result } = response;
  return result;
}

export async function getManifoldDeals() {
  const response = await bitrix.deals.list({
    filter: {
      CATEGORY_ID: '42',
    },
    select: ['*', 'UF_CRM_1527615815'],
  });

  const { result } = response;
  return result;
}

export async function getDeals({ ids }) {
  let batchObj = {};

  for (let id of ids) {
    const params = {
      ID: id,
    };
    batchObj[id] = { method: Method.CRM_DEAL_GET, params };
  }

  const { result, time } = await bitrix.batch(batchObj);
  return result;
}

export async function getContacts({ ids }) {
  let batchObj = {};

  for (let id of ids) {
    const params = {
      ID: id,
    };
    batchObj[id] = { method: Method.CRM_CONTACT_GET, params };
  }

  const { result, time } = await bitrix.batch(batchObj);
  return result;
}

export async function deleteBitrixTaskById({ task_id }) {
  try {
    const response = await bitrix.call('tasks.task.delete', {
      taskId: task_id,
    });
    const { result } = response;
    const { task } = result;

    if (!task) {
      throw { message: 'Task not found', task_id };
    }

    return task;
  } catch (e) {
    console.error({ message: 'Unable to delete task', task_id });
  }
}

export async function completeBitrixTaskById({ task_id }) {
  try {
    const response = await bitrix.call('tasks.task.complete', {
      taskId: task_id,
    });

    const { result } = response;
    const { task } = result;

    if (!task) {
      throw { message: 'Task not found', task_id };
    }

    return task;
  } catch (e) {
    console.error({ message: 'Unable to complete task', task_id });
  }
}

export async function addCommentToDeal({ deal_id, comment }) {
  try {
    const response = await bitrix.call('crm.timeline.comment.add', {
      'fields[ENTITY_ID]': deal_id,
      'fields[ENTITY_TYPE]': 'deal',
      'fields[COMMENT]': comment,
    });

    return response;
  } catch (e) {
    console.error({ message: 'Unable to create comment', deal_id });
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
  referrerPosition,
}) {
  const response = await bitrix.call('crm.item.add', {
    entityTypeId: '1102',
    'fields[title]': title,
    'fields[STAGE_ID]': stageId,
    'fields[ufCrm38_1728384234]': city,
    'fields[CONTACT_ID]': contactId,
    'fields[ASSIGNED_BY_ID]': assignedBy,
    'fields[ufCrm38_1727460853]': referrerPhone,
    'fields[ufCrm38_1727460831]': referrerName,
    'fields[ufCrm38_1727460760]': referrerPosition,
  });
  const { result } = response;
  const { item } = result;
  const { id } = item;
  return { id };
}

export async function addCommentToEntity({ entityId, typeId, comment }) {
  const response = await bitrix.call('crm.timeline.comment.add', {
    'fields[ENTITY_ID]': entityId,
    'fields[ENTITY_TYPE]': `DYNAMIC_${typeId}`,
    'fields[COMMENT]': comment,
  });

  const { result } = response;
  return { result };
}

export async function changeItemStage({ referralTypeId, id, stageId }) {
  await bitrix.call('crm.item.update', {
    entityTypeId: referralTypeId,
    id: id,
    'fields[STAGE_ID]': stageId,
  });
}

export async function createNewWorkingDriverItem({
  name,
  stageId,
  city,
  phone,
}) {
  const response = await bitrix.call('crm.item.add', {
    entityTypeId: '1110',
    'fields[title]': name,
    'fields[STAGE_ID]': stageId,
    'fields[ufCrm42_1728470444]': name,
    'fields[ufCrm42_1728470511]': phone,
    'fields[ufCrm42_1728470573]': city,
  });
  const { result } = response;
  const { item } = result;
  const { id } = item;
  return { id };
}

export async function getDtpDebtTransactions({ createdAt }) {
  const sql = fs.readFileSync('./src/sql/dtp_debt_transactions.sql').toString();

  const result = await pool.query(sql, [createdAt]);
  const { rows, rowCount } = result;
  return { rows };
}

export async function getDtpDealById({ id }) {
  const response = await bitrix.deals.list({
    filter: {
      ID: id,
      CATEGORY_ID: `19`,
    },
    select: [
      'ID',
      'UF_CRM_1654076033',
      'UF_CRM_1654075624',
      'UF_CRM_1654075693',
    ],
  });

  const { result, total } = response;
  return { result, total };
}

export async function addCommentToDtpDeal({ id, comment }) {
  const response = await bitrix.call('crm.timeline.comment.add', {
    'fields[ENTITY_ID]': id,
    'fields[ENTITY_TYPE]': `DEAL`,
    'fields[COMMENT]': comment,
  });

  const { result } = response;
  return { result };
}

export async function updateDealDebt({ id, debt }) {
  const response = await bitrix.call('crm.deal.update', {
    id: id,
    'fields[UF_CRM_1654076033]': debt,
  });

  const { result } = response;
  return { result };
}

export async function updateDealPayOff({ id, ufCrmField, amount }) {
  const key = `fields[${ufCrmField}]`;

  const response = await bitrix.call('crm.deal.update', {
    id: id,
    [key]: amount,
  });

  const { result } = response;
  return { result };
}

export async function createBitrixDriverBrandingCards({ cards }) {
  let batchObj = {};
  for (let card of cards) {
    const {
      driver_id,
      driver_name,
      myTaxiDriverUrl,
      phone,
      stage_id,
      cityBrandingId,
      weekNumber,
      year,
      total_trips,
      contact_id,
    } = card;
    const params = {
      entityTypeId: '1138',
      'fields[CONTACT_ID]': contact_id,
      'fields[title]': driver_name,
      'fields[STAGE_ID]': stage_id,
      'fields[ufCrm54_1738757291]': driver_name,
      'fields[ufCrm54_1738757552]': phone,
      'fields[ufCrm54_1738757612]': myTaxiDriverUrl,
      'fields[ufCrm54_1738757712]': total_trips,
      'fields[ufCrm54_1738757784]': weekNumber,
      'fields[ufCrm54_1738757867]': year,
      'fields[ufCrm54_1738757436]': cityBrandingId,
    };
    batchObj[driver_id] = { method: 'crm.item.add', params };
  }

  const { result: resp, time } = await bitrix.batch(batchObj);
  const { result: itemObj } = resp;
  return itemObj;
}

export async function updateBitrixDriverBrandingCards({ cards }) {
  let batchObj = {};
  for (let card of cards) {
    const { driver_id, stage_id, total_trips, bitrix_card_id } = card;
    const params = {
      id: bitrix_card_id,
      entityTypeId: '1138',
      'fields[STAGE_ID]': stage_id,
      'fields[ufCrm54_1738757712]': total_trips,
    };

    batchObj[driver_id] = { method: 'crm.item.update', params };
  }

  const { result: resp, time } = await bitrix.batch(batchObj);
  const { result: itemObj } = resp;

  //
  return itemObj;
}
export async function createBitrixFiredDebtorDriversCards({ cards }) {
  const batchObj = {};

  for (const card of cards) {
    const {
      stage_id,
      driver_id,
      full_name,
      cityBrandingId,
      cs_current_week,
      cs_current_year,
      current_week_total_deposit,
      current_week_total_debt,
      current_week_balance,
      fire_date,
      is_balance_enabled,
      balance_activation_value,
      is_deposit_enabled,
      deposit_activation_value,
    } = card;
    // Индивидуальные условия -> UF_CRM_64_1741780398
    // Комментарий -> UF_CRM_64_1741782814
    // Дата обработки -> UF_CRM_64_1741782917
    // Число активации блокировки депозита -  UF_CRM_64_1742373572
    const params = {
      entityTypeId: '1162',
      'fields[title]': full_name,
      'fields[STAGE_ID]': stage_id,
      'fields[ufCrm64_1741780227]': full_name,
      'fields[ufCrm64_1741780126]': cityBrandingId,
      'fields[ufCrm64_1741780303]': fire_date,
      'fields[ufCrm64_1741785328]': current_week_balance,
      'fields[ufCrm64_1741786347]': current_week_total_deposit,
      'fields[ufCrm64_1741786515]': current_week_total_debt,
      'fields[ufCrm64_1741780627]': cs_current_week,
      'fields[ufCrm64_1741780703]': cs_current_year,
      'fields[ufCrm64_1742373272]': is_balance_enabled,
      'fields[ufCrm64_1742373369]': balance_activation_value,
      'fields[ufCrm64_1742373461]': is_deposit_enabled,
      'fields[ufCrm64_1742373572]': deposit_activation_value,
    };
    batchObj[driver_id] = { method: 'crm.item.add', params };
  }

  const { result: resp, time } = await bitrix.batch(batchObj);
  const { result: itemObj } = resp;

  return itemObj;
}
export async function updateBitrixFiredDebtorDriversCards({ cards }) {
  const batchObj = {};

  for (const card of cards) {
    const {
      bitrix_card_id,
      stage_id,
      driver_id,
      cs_current_week,
      cs_current_year,
      current_week_balance,
      current_week_total_deposit,
      current_week_total_debt,
      is_balance_enabled,
      balance_activation_value,
      is_deposit_enabled,
      deposit_activation_value,
    } = card;
    // Индивидуальные условия -> UF_CRM_64_1741780398
    // Комментарий -> UF_CRM_64_1741782814
    // Дата обработки -> UF_CRM_64_1741782917
    // Число активации блокировки депозита -  UF_CRM_64_1742373572
    const params = {
      id: bitrix_card_id,
      entityTypeId: '1162',
      'fields[STAGE_ID]': stage_id,
      'fields[ufCrm64_1741785328]': current_week_balance,
      'fields[ufCrm64_1741786347]': current_week_total_deposit,
      'fields[ufCrm64_1741786515]': current_week_total_debt,
      'fields[ufCrm64_1741780627]': cs_current_week,
      'fields[ufCrm64_1741780703]': cs_current_year,
      'fields[ufCrm64_1742373272]': is_balance_enabled,
      'fields[ufCrm64_1742373369]': balance_activation_value,
      'fields[ufCrm64_1742373461]': is_deposit_enabled,
      'fields[ufCrm64_1742373572]': deposit_activation_value,
    };
    batchObj[driver_id] = { method: 'crm.item.update', params };
  }

  const { result: resp, time } = await bitrix.batch(batchObj);
  const { result: itemObj } = resp;

  return itemObj;
}

export async function findContactsByPhonesObjectReturned({ drivers }) {
  const batchObj = {};

  for (let driver of drivers) {
    const params = {
      entity_type: 'CONTACT',
      type: 'PHONE',
      'values[]': driver.phone,
    };
    batchObj[driver.driver_id] = { method: 'crm.duplicate.findbycomm', params };
  }
  const { result: temp_result } = await bitrix.batch(batchObj);
  const { result } = temp_result;
  return result;
}
export async function getCardIdsFromSpecialEntity(entityTypeId) {
  try {
    // Call the universal list method for the specified entity type.
    // We only select the 'ID' field.
    const { result } = await bitrix.call('crm.item.list', {
      entityTypeId,
      start:1831,
      select: ['ID','TITLE','ufCrm4_1744703234']
    });
    
    // // Map the result to extract only the ID from each card (or CRM item)
    // const cardIds = result.map(item => item.ID);
    
    // console.log('Retrieved card IDs:', cardIds);
    return result.items;
  } catch (error) {
    console.error('Error retrieving cards from entity:', error);
    throw error;
  }
}

export async function getAllSpecialEntityRows(entityTypeId) {
  // Define how many rows to request per call. Many Bitrix methods default to 50.
  const pageSize = 50;
  
  // If you already know approximately how many rows to expect,
  // you can calculate the number of pages. For example, for 2K rows:
  const totalPages = Math.ceil(2000 / pageSize);  // This gives ~40 pages
  
  // Build the batch command object.
  const batchCommands = {};
  for (let i = 0; i < totalPages; i++) {
    // Each batch command calls crm.item.list with a different "start" offset.
    batchCommands[`cmd_${i}`] = [
      'crm.item.list',
      {
        entityTypeId,
        start: i * pageSize,
        // Select the fields you need, for example, ID and your custom field.
        select: ['ID', 'TITLE']
      }
    ];
  }
  
  try {
    // Call the 'batch' method with the commands. All commands execute in one request.
    const { result } = await bitrix.call('batch', { cmd: batchCommands });
    
    // Merge the pages
    let allRows = [];
    for (let i = 0; i < totalPages; i++) {
      const cmdResult = result[`cmd_${i}`];
      if (cmdResult && cmdResult.result && cmdResult.result.length) {
        allRows = allRows.concat(cmdResult.result);
      }
    }
    console.log('Retrieved rows:', allRows);
    return allRows;
  } catch (error) {
    console.error('Error retrieving rows in batch:', error);
    throw error;
  }
}

export async function updateCarStatusAndBrnad({status,brand,bitrix_card_id}){
  console.log({status,brand,bitrix_card_id})
  const response = await bitrix.call('crm.item.update', {
    id: bitrix_card_id,
    entityTypeId:'138',
    'fields[ufCrm4_1744703234]': status,//UF_CRM_4_1744703234
    'fields[ufCrm4_1741607811]': brand,//UF_CRM_4_1741607811
  });
  const { result } = response;
  return result;
}