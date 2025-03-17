import sqlite3 from 'sqlite3';
import { open } from 'sqlite'


const db = await open({
    filename: process.env.DEV_DB,
    driver: sqlite3.Database
})


/**
 * Create a branding process and return the whole record.
 */
export async function createBrandingProcess({ weekNumber, year, period_from, period_to }) {
    const sql = `
        INSERT INTO branding_processes (weekNumber, year, period_from, period_to, is_completed, created_at)
        VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
        RETURNING *;
    `;

    return db.get(sql, weekNumber, year, period_from, period_to);
}

/**
 * Get a branding process by weekNumber and year.
 */
export async function getBrandingProcessByWeekNumber({ weekNumber, year }) {
    const sql = `SELECT * FROM branding_processes WHERE weekNumber = ? AND year = ?`;

    return db.get(sql, weekNumber, year);
}

/**
 * Resolve a branding process (set is_completed = 1) and return the updated record.
 */
export async function resolveBrandingProcessById(brandingProcessId) {
    const sql = `
        UPDATE branding_processes
        SET is_completed = 1
        WHERE id = ?
        RETURNING *;
    `;

    return db.get(sql, brandingProcessId);
}


/**
 * Inserts a new branding card record linked to a branding process.
 * @param {Object} card - An object with driver_id, bitrix_card_id, total_trips, and branding_process_id.
 * @returns {Promise<Object>} - Resolves with the inserted record.
 */
export async function insertBrandingCard(card) {
  const { driver_id, bitrix_card_id, total_trips, branding_process_id } = card;

  const sql = `
        INSERT INTO branding_cards
        (driver_id, bitrix_card_id, total_trips, branding_process_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *;
    `;

    return db.get(sql, driver_id, bitrix_card_id, total_trips, branding_process_id);
}

/**
 * Retrieves a branding card by driver_id, joining branding_processes to get weekNumber & year.
 * @param {string} driver_id - The driver ID.
 * @param branding_process_id
 * @returns {Promise<Object>} - Resolves with the matching row (or undefined if not found).
 */
export async function getCrmBrandingCardByDriverId({
  driver_id, branding_process_id,
}) {
  const sql = `
        SELECT bc.*, bp.weekNumber, bp.year
        FROM branding_cards bc
        LEFT JOIN branding_processes bp ON bc.branding_process_id = bp.id
        WHERE bc.driver_id = ? AND bp.id=?;
    `;

  return db.get(sql, driver_id,branding_process_id);
}

/**
 * Updates total_trips for a branding card using driver_id and branding_process_id.
 * @param {string} driver_id - The driver ID.
 * @param {string} branding_process_id - The related branding process ID.
 * @param {string} total_trips - The updated total trips count.
 * @returns {Promise<Object>} - Resolves with the updated row.
 */
export async function updateBrandingCardByDriverId({ driver_id, branding_process_id, total_trips }) {
    const sql = `
        UPDATE branding_cards 
        SET total_trips = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE driver_id = ? AND branding_process_id = ?
        RETURNING *;
    `;

    return db.get(sql, total_trips, driver_id, branding_process_id);
}


export async function getLastUnixCreatedAt({ categoryId }) {
    const sql = `SELECT unix_created_at FROM last_fired_driver WHERE category_id = ?`
    return db.get(sql, categoryId)
}

export async function saveLastUnixCreatedAt({ unixCreatedAt, categoryId }) {
    const sql = `UPDATE last_fired_driver SET unix_created_at = ? WHERE category_id = ?`
    await db.run(
        sql,
        unixCreatedAt,
        categoryId
    )
}


export async function getAllDriversWithRevenueWitnNoConcacts() {
    const sql = `SELECT driver_id,phone FROM drivers_revenue where contacts_array is null`;
    const driversWithRevenue = await db.all(sql)
    return { driversWithRevenue }
}

export async function getAllDriversWithRevenueWitnConcactsAndNoDeals({ companyIds }) {
    const placeholders = companyIds.map(() => '?').join(',');
    const sql = `SELECT driver_id,contacts_array FROM drivers_revenue where contacts_array is not null and deal_id is null and company_id in (${placeholders})`;
    const driversWithRevenue = await db.all(sql, companyIds)
    return { driversWithRevenue }
}

export async function updateContactsInDriversWithRevenue(driversWithRevenueAndContacts) {
    await db.exec('BEGIN TRANSACTION');
    try {
        for (const driver of driversWithRevenueAndContacts) {
            const { driver_id, contacts } = driver
            await db.run('UPDATE drivers_revenue SET contacts_array = ?, contacts_add_at = CURRENT_TIMESTAMP WHERE driver_id = ?', JSON.stringify(contacts), driver_id);
        }
        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Ошибка при вставке данных:', error);
    }
}

export async function updateLeadInDriversWithRevenue(concatsWithDeals) {
    await db.exec('BEGIN TRANSACTION');
    try {
        for (const driver of concatsWithDeals) {
            const { deal_id, concact_id } = driver
            await db.run(`UPDATE drivers_revenue SET deal_id = ?, deat_add_at = CURRENT_TIMESTAMP WHERE contacts_array like ?`, deal_id, `%${concact_id}%`);
        }
        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Ошибка при вставке данных:', error);
    }
}

export async function getDriversWithRevenueWitnDealSyncReady() {
    const sql = `SELECT deal_id,auto_park_revenue FROM drivers_revenue where deal_id is not null and (sync_at < updated_at or sync_at is null)`;
    const driversWithRevenueWitnDeal = await db.all(sql)
    return { driversWithRevenueWitnDeal }
}

export async function updateSyncTimeForDriversWithRevenue(updatedDealsInChunk) {
    await db.exec('BEGIN TRANSACTION');
    try {
        for (const driver of updatedDealsInChunk) {
            const { deal_id } = driver
            await db.run(`UPDATE drivers_revenue SET sync_at = CURRENT_TIMESTAMP WHERE deal_id = ?`, deal_id);
        }
        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Ошибка при вставке данных:', error);
    }
}

export async function clearManifoldDealsTable() {
    const sql = `DELETE FROM manifold_deals WHERE ID IS NOT NULL`
    await db.run(sql)
}

export async function insertManifoldDeals(manifoldDeals) {
    await db.exec('BEGIN TRANSACTION');
    try {
        for (const deal of manifoldDeals) {
            const { id, deal_created_at, stage_id, city_name, assigned_by_id, title } = deal
            await db.run('INSERT INTO manifold_deals (id,deal_created_at,stage_id,city_name,assigned_by_id,title) VALUES (?,?,?,?,?,?)', id, deal_created_at, stage_id, city_name, assigned_by_id, title);
        }
        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Ошибка при вставке данных:', error);
    }
}

export async function getSavedManifoldDeals() {
    const sql = `SELECT id,accident_id,aviable_for_office_only,contact_id,contact_phone,deal_created_at,stage_id,city_name,assigned_by_id,title FROM manifold_deals`;
    const manifoldDealsIds = await db.all(sql)
    return { manifoldDealsIds }
}

export async function getSavedManifoldDealsWithNoAncidentData() {
    const sql = `SELECT id FROM manifold_deals where accident_id is null`;
    const manifoldDealsIds = await db.all(sql)
    return { manifoldDealsIds }
}

export async function getSavedManifoldDealsWithNoContactId() {
    const sql = `SELECT id FROM manifold_deals where contact_id is null`;
    const manifoldDealsAncidentIds = await db.all(sql)
    return { manifoldDealsAncidentIds }
}

export async function getSavedManifoldContactIdsWithNoPhone() {
    const sql = `SELECT contact_id FROM manifold_deals where contact_phone is null and contact_id is not null`;
    const manifoldDealsAncidentIds = await db.all(sql)
    return { manifoldDealsAncidentIds }
}


export async function updateManifoldDealsAncidentData(manifoldDealsData) {
    await db.exec('BEGIN TRANSACTION');
    try {
        for (let [id, data] of Object.entries(manifoldDealsData)) {
            const {
                UF_CRM_1654602086875: accident_id,
                UF_CRM_1672920789484: aviable_for_office_only } = data

            let aviable = (aviable_for_office_only == '') ? 0 : 1
            await db.run(`UPDATE manifold_deals SET accident_id = ?, aviable_for_office_only = ? WHERE id = ?`, accident_id, aviable, id);
        }
        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Ошибка при вставке данных:', error);
    }
}

export async function updateManifoldDealsContactId(manifoldDealsData) {
    await db.exec('BEGIN TRANSACTION');
    try {
        for (let [id, data] of Object.entries(manifoldDealsData)) {
            const {
                CONTACT_ID: contact_id
            } = data
            await db.run(`UPDATE manifold_deals SET contact_id = ? WHERE id = ?`, contact_id, id);
        }
        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Ошибка при вставке данных:', error);
    }
}

export async function updateManifoldDealsPhone(manifoldDealsData) {
    await db.exec('BEGIN TRANSACTION');
    try {
        for (let [contact_id, data] of Object.entries(manifoldDealsData)) {
            await db.run(`UPDATE manifold_deals SET contact_phone = ?, contacts_add_at = CURRENT_TIMESTAMP WHERE contact_id = ?`, data.phone, contact_id);
        }
        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Ошибка при вставке данных:', error);
    }
}

export async function saveRecruitDeal({
    task_id,
    doc_id,
    first_name,
    last_name,
    contract,
    deal_id,
    auto_park_id,
    driver_id,
    expiry_after,
    procent_reward_expiry_after,
    contact_id,
    assigned_by_id,
    city_id }) {

    const sql = `INSERT INTO referral(driver_id,auto_park_id,deal_id,task_id,contract,doc_id,first_name,last_name,expiry_after,contact_id,assigned_by_id,city_id,procent_reward_expiry_after) 
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`

    await db.run(
        sql,
        driver_id,
        auto_park_id,
        deal_id,
        task_id,
        contract,
        doc_id,
        first_name,
        last_name,
        expiry_after,
        contact_id,
        assigned_by_id,
        city_id,
        procent_reward_expiry_after
    )
}

export async function saveReferralIdForRecruitDeal({
    deal_id,
    referral_id,
    task_id }) {

    const sql = `UPDATE referral SET referral_id = ? WHERE deal_id = ? AND task_id = ?`

    await db.run(
        sql,
        referral_id,
        deal_id,
        task_id
    )
}

export async function approvalReferralById({
    referral_id,
    referrer_phone,
    referrer_name,
    referrer_position }) {
    const sql = `UPDATE 
                    referral 
                SET is_approved = TRUE,
                    referrer_phone = ?, 
                    referrer_name = ?,
                    referrer_position = ?
                WHERE referral_id = ?`
    await db.run(
        sql,
        referrer_phone,
        referrer_name,
        referrer_position,
        referral_id
    )
}

export async function getActiveRefferals({ date, procentageRewardAutoParkIds }) {
    const autoParkFilter = procentageRewardAutoParkIds && procentageRewardAutoParkIds.length > 0
        ? `AND auto_park_id NOT IN (${procentageRewardAutoParkIds.map(id => `'${id}'`).join(', ')})`
        : '';

    const sql = `SELECT 
                    driver_id,
                    auto_park_id,
                    referral_id,
                    contact_id,
                    first_name,
                    last_name,
                    date(created_at) as created_date,
                    JULIANDAY('${date}')-JULIANDAY(date(created_at)) as days_passed,
                    referrer_phone,
                    referrer_name,
                    referrer_position,
                    city_id
                FROM referral 
                WHERE date(expiry_after) >= '${date}'
                AND referral_id is not null 
                AND is_approved is TRUE
                ${autoParkFilter}`;

  const activeRefferals = await db.all(sql);
  return { activeRefferals };
}

export async function getActiveRefferalsProcentageReward({ date, procentageRewardAutoParkIds }) {
    const autoParkFilter = procentageRewardAutoParkIds && procentageRewardAutoParkIds.length > 0
        ? `AND auto_park_id IN (${procentageRewardAutoParkIds.map(id => `'${id}'`).join(', ')})`
        : '';

    const sql = `SELECT 
                    driver_id,
                    auto_park_id,
                    referral_id,
                    contact_id,
                    first_name,
                    last_name,
                    date(created_at) as created_date,
                    JULIANDAY('${date}')-JULIANDAY(date(created_at)) as days_passed,
                    referrer_phone,
                    referrer_name,
                    referrer_position,
                    city_id
                FROM referral 
                WHERE date(expiry_after) >= '${date}'
                AND referral_id is not null 
                AND is_approved is TRUE
                ${autoParkFilter}`;

  const activeRefferals = await db.all(sql);
  return { activeRefferals };
}

export async function getFinishedRefferals({ procentageRewardAutoParkIds }) {
  const autoParkFilter =
    procentageRewardAutoParkIds && procentageRewardAutoParkIds.length > 0
      ? `AND auto_park_id NOT IN (${procentageRewardAutoParkIds.map((id) => `'${id}'`).join(', ')})`
      : '';

    const sql = `SELECT 
                    referral_id
                FROM referral 
                WHERE date(expiry_after) < current_date
                AND referral_id is not null
                ${autoParkFilter}`;

  const finishedRefferals = await db.all(sql);
  return { finishedRefferals };
}

export async function getFinishedRefferalsProcentageReward({
  procentageRewardAutoParkIds,
}) {
  const autoParkFilter =
    procentageRewardAutoParkIds && procentageRewardAutoParkIds.length > 0
      ? `AND auto_park_id IN (${procentageRewardAutoParkIds.map((id) => `'${id}'`).join(', ')})`
      : '';

  const sql = `SELECT 
                    referral_id
                FROM referral 
                WHERE date(procent_reward_expiry_after) < current_date
                AND referral_id is not null
                ${autoParkFilter}`;

    const finishedRefferalsProcentageReward = await db.all(sql)
    return { finishedRefferalsProcentageReward }
}

export async function insertNewWorkingDriver({
  id,
  auto_park_id,
  first_name,
  last_name,
  phone,
  created_at,
  item_id,
}) {
  await db.run(
    'INSERT INTO working_drivers (driver_id, auto_park_id, first_name, last_name, phone, registrated_at,item_id) VALUES (?,?,?,?,?,?,?)',
    id,
    auto_park_id,
    first_name,
    last_name,
    phone,
    created_at,
    item_id
  );
}

export async function getNewWorkingDriverWorked7Days({ date }) {
  const sql = `SELECT 
                    driver_id,
                    auto_park_id,
                    item_id,
                    registrated_at
                FROM working_drivers 
                WHERE JULIANDAY('${date}')-JULIANDAY(date(registrated_at)) = 7`;

  const newWorkingDriverWorked7Days = await db.all(sql);
  return { newWorkingDriverWorked7Days };
}

export async function saveDtpDebtTransactions(dtpDebtTopUps) {
  await db.exec('BEGIN TRANSACTION');
  try {
    for (const transaction of dtpDebtTopUps) {
      const {
        auto_park_id,
        driver_id,
        human_id,
        purpose,
        sum,
        added_by_user_name,
        dtp_deal_id,
        created_at,
      } = transaction;
      await db.run(
        `INSERT INTO 
                dtp_debt_transactions (auto_park_id,driver_id,human_id,purpose,sum,added_by_user_name,dtp_deal_id,created_at) 
                VALUES (?,?,?,?,?,?,?,?)`,
        auto_park_id,
        driver_id,
        human_id,
        purpose,
        sum,
        added_by_user_name,
        dtp_deal_id,
        created_at
      );
    }
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    console.error('Ошибка при вставке данных:', error);
  }
}

export async function lastsaveDtpDebtTransactionDate() {
  const lastDtpDebtTopUp = await db.get(
    `SELECT max(created_at) as created_at from dtp_debt_transactions`
  );
  return lastDtpDebtTopUp;
}

export async function getDtpDebtTransactionsForValidation() {
  const sql = `SELECT dtp_deal_id from dtp_debt_transactions where is_valid is null`;
  const dtpDebtTransactionsForValidation = await db.all(sql);
  return { dtpDebtTransactionsForValidation };
}

export async function markDtpDebtTransactionsIsValid({ id }) {
  const sql = `UPDATE dtp_debt_transactions SET is_valid = true WHERE dtp_deal_id = ?`;
  await db.run(sql, id);
}

export async function markDtpDebtTransactionsIsNotValid({ id }) {
  const sql = `UPDATE dtp_debt_transactions SET is_valid = false WHERE dtp_deal_id = ?`;
  await db.run(sql, id);
}

export async function getDtpAccrueDebtTransactions() {
    const sql = `SELECT auto_park_id,
                        driver_id,
                        human_id,
                        purpose,
                        added_by_user_name,
                        dtp_deal_id,
                        sum
                    from dtp_debt_transactions 
                where is_valid is true
                and is_synchronised is false`;
  const dtpAccrueDebtTransactions = await db.all(sql);
  return { dtpAccrueDebtTransactions };
}

export async function markDtpDebtTransactionsAsSync({ human_id }) {
    const sql = `UPDATE dtp_debt_transactions SET is_synchronised = true WHERE human_id = ?`;
    await db.run(sql, human_id);
}
/**
 * Inserts a new fired debtor driver record.
 * @param {Object} driver - The driver details.
 * @returns {Promise<Object>} - The inserted record.
 */
export async function insertFiredDebtorDriver(driver) {
    const {
        birtrix_card_id,
        full_name,
        auto_park_id,
        cs_current_week,
        cs_current_year,
        current_week_balance,
        current_week_total_deposit,
        current_week_total_debt,
        fire_date,
    } = driver;
    const sql = `
        INSERT INTO fired_debtor_drivers 
        (birtrix_card_id, full_name, auto_park_id, cs_current_week, cs_current_year, current_week_balance, current_week_total_deposit, current_week_total_debt, fire_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *;
    `;
    return db.get(
        sql,
        birtrix_card_id,
        full_name,
        auto_park_id,
        cs_current_week,
        cs_current_year,
        current_week_balance,
        current_week_total_deposit,
        current_week_total_debt,
        fire_date
    );
}

/**
 * Retrieves a fired debtor driver by birtrix_card_id.
 * @param {number} birtrix_card_id - The card ID.
 * @returns {Promise<Object>} - The matching record.
 */
export async function getFiredDebtorDriverById(birtrix_card_id) {
    const sql = `
        SELECT * FROM fired_debtor_drivers WHERE birtrix_card_id = ?;
    `;
    return db.get(sql, birtrix_card_id);
  const sql = `UPDATE dtp_debt_transactions SET is_synchronised = true WHERE human_id = ?`;
  await db.run(sql, human_id);
}

/**
 * Updates a fired debtor driver's balance details.
 * @param {number} birtrix_card_id - The card ID.
 * @param {string} current_week_balance - The updated balance.
 * @param {string} current_week_total_deposit - The updated total deposit.
 * @param {string} current_week_total_debt - The updated total debt.
 * @returns {Promise<Object>} - The updated record.
 */
export async function updateFiredDebtorDriverBalance({ birtrix_card_id, current_week_balance, current_week_total_deposit, current_week_total_debt }) {
    const sql = `
        UPDATE fired_debtor_drivers 
        SET current_week_balance = ?, current_week_total_deposit = ?, current_week_total_debt = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE birtrix_card_id = ?
        RETURNING *;
    `;
    return db.get(sql, current_week_balance, current_week_total_deposit, current_week_total_debt, birtrix_card_id);
}
