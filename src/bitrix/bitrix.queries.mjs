import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: process.env.DEV_DB,
  driver: sqlite3.Database,
});

/**
 * Create a branding process and return the whole record.
 */
export async function createBrandingProcess({
  weekNumber,
  year,
  period_from,
  period_to,
}) {
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
  const {
    driver_id,
    bitrix_card_id,
    total_trips,
    branding_process_id,
    auto_park_id,
    license_plate,
  } = card;

  const sql = /*sql*/ `
        INSERT INTO branding_cards
        (driver_id, bitrix_card_id,license_plate, total_trips, branding_process_id, auto_park_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *;
    `;

  return db.get(
    sql,
    driver_id,
    bitrix_card_id,
    license_plate,
    total_trips,
    branding_process_id,
    auto_park_id
  );
}

/**
 * Retrieves a branding card by driver_id, joining branding_processes to get weekNumber & year.
 * @param {string} driver_id - The driver ID.
 * @param branding_process_id
 * @returns {Promise<Object>} - Resolves with the matching row (or undefined if not found).
 */
export async function getCrmBrandingCardByDriverId({
  driver_id,
  branding_process_id,
}) {
  const sql = `
        SELECT bc.*, bp.weekNumber, bp.year
        FROM branding_cards bc
        LEFT JOIN branding_processes bp ON bc.branding_process_id = bp.id
        WHERE bc.driver_id = ? AND bp.id=?;
    `;

  return db.get(sql, driver_id, branding_process_id);
}

/**
 * Updates total_trips for a branding card using driver_id and branding_process_id.
 * @param {string} driver_id - The driver ID.
 * @param {string} branding_process_id - The related branding process ID.
 * @param {string} total_trips - The updated total trips count.
 * @returns {Promise<Object>} - Resolves with the updated row.
 */
export async function updateBrandingCardByDriverId({
  driver_id,
  branding_process_id,
  total_trips,
}) {
  const sql = `
        UPDATE branding_cards 
        SET total_trips = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE driver_id = ? AND branding_process_id = ?
        RETURNING *;
    `;

  return db.get(sql, total_trips, driver_id, branding_process_id);
}

export async function getLastUnixCreatedAt({ categoryId }) {
  const sql = `SELECT unix_created_at FROM last_fired_driver WHERE category_id = ?`;
  return db.get(sql, categoryId);
}

export async function saveLastUnixCreatedAt({ unixCreatedAt, categoryId }) {
  const sql = `UPDATE last_fired_driver SET unix_created_at = ? WHERE category_id = ?`;
  await db.run(sql, unixCreatedAt, categoryId);
}

export async function getAllDriversWithRevenueWitnNoConcacts() {
  const sql = `SELECT driver_id,phone FROM drivers_revenue where contacts_array is null`;
  const driversWithRevenue = await db.all(sql);
  return { driversWithRevenue };
}

export async function getAllDriversWithRevenueWitnConcactsAndNoDeals({
  companyIds,
}) {
  const placeholders = companyIds.map(() => '?').join(',');
  const sql = `SELECT driver_id,contacts_array FROM drivers_revenue where contacts_array is not null and deal_id is null and company_id in (${placeholders})`;
  const driversWithRevenue = await db.all(sql, companyIds);
  return { driversWithRevenue };
}

export async function updateContactsInDriversWithRevenue(
  driversWithRevenueAndContacts
) {
  await db.exec('BEGIN TRANSACTION');
  try {
    for (const driver of driversWithRevenueAndContacts) {
      const { driver_id, contacts } = driver;
      await db.run(
        'UPDATE drivers_revenue SET contacts_array = ?, contacts_add_at = CURRENT_TIMESTAMP WHERE driver_id = ?',
        JSON.stringify(contacts),
        driver_id
      );
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
      const { deal_id, concact_id } = driver;
      await db.run(
        `UPDATE drivers_revenue SET deal_id = ?, deat_add_at = CURRENT_TIMESTAMP WHERE contacts_array like ?`,
        deal_id,
        `%${concact_id}%`
      );
    }
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    console.error('Ошибка при вставке данных:', error);
  }
}

export async function getDriversWithRevenueWitnDealSyncReady() {
  const sql = `SELECT deal_id,auto_park_revenue FROM drivers_revenue where deal_id is not null and (sync_at < updated_at or sync_at is null)`;
  const driversWithRevenueWitnDeal = await db.all(sql);
  return { driversWithRevenueWitnDeal };
}

export async function updateSyncTimeForDriversWithRevenue(updatedDealsInChunk) {
  await db.exec('BEGIN TRANSACTION');
  try {
    for (const driver of updatedDealsInChunk) {
      const { deal_id } = driver;
      await db.run(
        `UPDATE drivers_revenue SET sync_at = CURRENT_TIMESTAMP WHERE deal_id = ?`,
        deal_id
      );
    }
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    console.error('Ошибка при вставке данных:', error);
  }
}

export async function clearManifoldDealsTable() {
  const sql = `DELETE FROM manifold_deals WHERE ID IS NOT NULL`;
  await db.run(sql);
}

export async function insertManifoldDeals(manifoldDeals) {
  await db.exec('BEGIN TRANSACTION');
  try {
    for (const deal of manifoldDeals) {
      const {
        id,
        deal_created_at,
        stage_id,
        city_name,
        assigned_by_id,
        title,
      } = deal;
      await db.run(
        'INSERT INTO manifold_deals (id,deal_created_at,stage_id,city_name,assigned_by_id,title) VALUES (?,?,?,?,?,?)',
        id,
        deal_created_at,
        stage_id,
        city_name,
        assigned_by_id,
        title
      );
    }
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    console.error('Ошибка при вставке данных:', error);
  }
}

export async function getSavedManifoldDeals() {
  const sql = `SELECT id,accident_id,aviable_for_office_only,contact_id,contact_phone,deal_created_at,stage_id,city_name,assigned_by_id,title FROM manifold_deals`;
  const manifoldDealsIds = await db.all(sql);
  return { manifoldDealsIds };
}

export async function getSavedManifoldDealsWithNoAncidentData() {
  const sql = `SELECT id FROM manifold_deals where accident_id is null`;
  const manifoldDealsIds = await db.all(sql);
  return { manifoldDealsIds };
}

export async function getSavedManifoldDealsWithNoContactId() {
  const sql = `SELECT id FROM manifold_deals where contact_id is null`;
  const manifoldDealsAncidentIds = await db.all(sql);
  return { manifoldDealsAncidentIds };
}

export async function getSavedManifoldContactIdsWithNoPhone() {
  const sql = `SELECT contact_id FROM manifold_deals where contact_phone is null and contact_id is not null`;
  const manifoldDealsAncidentIds = await db.all(sql);
  return { manifoldDealsAncidentIds };
}

export async function updateManifoldDealsAncidentData(manifoldDealsData) {
  await db.exec('BEGIN TRANSACTION');
  try {
    for (let [id, data] of Object.entries(manifoldDealsData)) {
      const {
        UF_CRM_1654602086875: accident_id,
        UF_CRM_1672920789484: aviable_for_office_only,
      } = data;

      let aviable = aviable_for_office_only == '' ? 0 : 1;
      await db.run(
        `UPDATE manifold_deals SET accident_id = ?, aviable_for_office_only = ? WHERE id = ?`,
        accident_id,
        aviable,
        id
      );
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
      const { CONTACT_ID: contact_id } = data;
      await db.run(
        `UPDATE manifold_deals SET contact_id = ? WHERE id = ?`,
        contact_id,
        id
      );
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
      await db.run(
        `UPDATE manifold_deals SET contact_phone = ?, contacts_add_at = CURRENT_TIMESTAMP WHERE contact_id = ?`,
        data.phone,
        contact_id
      );
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
  city_id,
}) {
  const sql = `INSERT INTO referral(driver_id,auto_park_id,deal_id,task_id,contract,doc_id,first_name,last_name,expiry_after,contact_id,assigned_by_id,city_id,procent_reward_expiry_after) 
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`;

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
  );
}

export async function saveReferralIdForRecruitDeal({
  deal_id,
  referral_id,
  task_id,
}) {
  const sql = `UPDATE referral SET referral_id = ? WHERE deal_id = ? AND task_id = ?`;

  await db.run(sql, referral_id, deal_id, task_id);
}

export async function approvalReferralById({
  referral_id,
  referrer_phone,
  referrer_name,
  referrer_position,
}) {
  const sql = `UPDATE 
                    referral 
                SET is_approved = TRUE,
                    referrer_phone = ?, 
                    referrer_name = ?,
                    referrer_position = ?
                WHERE referral_id = ?`;
  await db.run(
    sql,
    referrer_phone,
    referrer_name,
    referrer_position,
    referral_id
  );
}

export async function getActiveRefferals({
  date,
  procentageRewardAutoParkIds,
}) {
  const autoParkFilter =
    procentageRewardAutoParkIds && procentageRewardAutoParkIds.length > 0
      ? `AND auto_park_id NOT IN (${procentageRewardAutoParkIds.map((id) => `'${id}'`).join(', ')})`
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

export async function getActiveRefferalsProcentageReward({
  date,
  procentageRewardAutoParkIds,
}) {
  const autoParkFilter =
    procentageRewardAutoParkIds && procentageRewardAutoParkIds.length > 0
      ? `AND auto_park_id IN (${procentageRewardAutoParkIds.map((id) => `'${id}'`).join(', ')})`
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
                    referral_id,
                    created_at
                FROM referral 
                WHERE date(expiry_after) < current_date
                AND referral_id is not null
                AND is_closed is FALSE
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
                    referral_id,
                    created_at
                FROM referral 
                WHERE date(procent_reward_expiry_after) < current_date
                AND referral_id is not null
                AND is_closed is FALSE
                ${autoParkFilter}`;

  const finishedRefferalsProcentageReward = await db.all(sql);
  return { finishedRefferalsProcentageReward };
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
export async function getBrandedLicencePlateNumbersByBrandingProcessId({
  branding_process_id,
}) {
  const sql = `
        SELECT bc.license_plate
        FROM branding_cards bc
        WHERE  bc.branding_process_id=?;
    `;

  const licencePlates = await db.all(sql, branding_process_id);
  const brandedLicencePlateNumbers = licencePlates.map(
    (lp) => lp.license_plate
  );
  return { brandedLicencePlateNumbers };
}
/**
 * Inserts a new fired debtor driver record.
 * @param {Object} driver - The driver details.
 * @returns {Promise<Object>} - The inserted record.
 */
export async function insertFiredDebtorDriver(driver) {
  const {
    bitrix_card_id,
    driver_id,
    full_name,
    auto_park_id,
    cs_current_week,
    cs_current_year,
    current_week_balance,
    current_week_total_deposit,
    current_week_total_debt,
    fire_date,
    is_balance_enabled,
    balance_activation_value,
    is_deposit_enabled,
    deposit_activation_value,
  } = driver;
  const sql = `
      INSERT INTO fired_debtor_drivers
      (bitrix_card_id, driver_id, full_name, auto_park_id, cs_current_week, cs_current_year, current_week_balance, current_week_total_deposit, current_week_total_debt, fire_date, is_balance_enabled, balance_activation_value, is_deposit_enabled, deposit_activation_value, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *;
  `;
  return db.get(
    sql,
    bitrix_card_id,
    driver_id,
    full_name,
    auto_park_id,
    cs_current_week,
    cs_current_year,
    current_week_balance,
    current_week_total_deposit,
    current_week_total_debt,
    fire_date,
    is_balance_enabled,
    balance_activation_value,
    is_deposit_enabled,
    deposit_activation_value
  );
}
/**
 * Retrieves all driver IDs from fired_debtor_drivers.
 * @returns {Promise<Array>} - An array of driver IDs.
 */
export async function getAllFiredDebtorDriver() {
  const sql = `
      SELECT driver_id FROM fired_debtor_drivers;
  `;
  return db.all(sql);
}

/**
 * Updates multiple fields in the fired_debtor_drivers table identified by bitrix_card_id.
 * @param {Object} params - The update parameters.
 * @param {number} params.bitrix_card_id - The Bitrix card ID.
 * @param {number} params.cs_current_week - The current CS week.
 * @param {number} params.cs_current_year - The current CS year.
 * @param {number} params.current_week_balance - The balance for the current week.
 * @param {number} params.current_week_total_deposit - The total deposit for the current week.
 * @param {number} params.current_week_total_debt - The total debt for the current week.
 * @param {boolean} params.is_balance_enabled - Whether the balance feature is enabled.
 * @param {number} params.balance_activation_value - The balance activation value.
 * @param {boolean} params.is_deposit_enabled - Whether deposits are enabled.
 * @param {number} params.deposit_activation_value - The deposit activation value.
 * @returns {Promise<Object>} - The updated record.
 */
export async function updateFiredDebtorDriver({
  bitrix_card_id,
  cs_current_week,
  cs_current_year,
  current_week_balance,
  current_week_total_deposit,
  current_week_total_debt,
  is_balance_enabled,
  balance_activation_value,
  is_deposit_enabled,
  deposit_activation_value,
}) {
  const sql = `
      UPDATE fired_debtor_drivers
      SET cs_current_week = ?,
          cs_current_year = ?,
          current_week_balance = ?,
          current_week_total_deposit = ?,
          current_week_total_debt = ?,
          is_balance_enabled = ?,
          balance_activation_value = ?,
          is_deposit_enabled = ?,
          deposit_activation_value = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE bitrix_card_id = ?
          RETURNING *;
  `;

  return db.get(
    sql,
    cs_current_week,
    cs_current_year,
    current_week_balance,
    current_week_total_deposit,
    current_week_total_debt,
    is_balance_enabled,
    balance_activation_value,
    is_deposit_enabled,
    deposit_activation_value,
    bitrix_card_id
  );
}

/**
 * Retrieves a fired debtor driver by driver_id, current week number, and current year.
 * @param {string} driver_id - The driver ID.
 * @param {number} cs_current_week - The current week number.
 * @param {number} cs_current_year - The current year.
 * @returns {Promise<Object>} - The matching record.
 */
export async function getFiredDebtorDriverByDriverId({ driver_id }) {
  const sql = `
        SELECT bitrix_card_id, driver_id, full_name, auto_park_id, cs_current_week, cs_current_year, current_week_balance, current_week_total_deposit, current_week_total_debt, fire_date, is_balance_enabled, balance_activation_value, is_deposit_enabled, deposit_activation_value, created_at, updated_at FROM fired_debtor_drivers WHERE driver_id = ?;
    `;
  return db.get(sql, driver_id);
}

/**
 * Creates a new entry in the bolt_drivers_to_ban table.
 * @param {Object} params - The parameters for the new driver.
 * @param {string} params.driver_id - The unique ID of the driver.
 * @param {string} params.bolt_id - The Bolt ID of the driver.
 * @param {number} params.bitrix_deal_id - The Bitrix deal ID associated with the driver.
 * @param {string} params.phone - The phone number of the driver.
 * @returns {Promise<Object>} - A promise that resolves with an object indicating success (e.g., { changes: 1, lastID: ... } if supported by the driver).
 */
export async function insertBoltDriverToBan({
  driver_id,
  bolt_id,
  bitrix_deal_id,
  phone,
}) {
  const sql = /*sql*/ `
      INSERT INTO bolt_drivers_to_ban (driver_id, bolt_id, bitrix_deal_id, phone)
      VALUES (?, ?, ?, ?);
  `;
  return db.run(sql, driver_id, bolt_id, bitrix_deal_id, phone);
}

/**
 * Sets the is_first_letter_approved flag to true for a specific driver.
 * @param {Object} params - The parameters for updating the driver.
 * @param {string} params.bitrix_deal_id - The ID of the driver to update.
 * @returns {Promise<Object>} - A promise that resolves with an object indicating success (e.g., { changes: 1 }).
 */
export async function setLetterApprovedByDealId({
  bitrix_deal_id: input,
  letter_column,
}) {
  const sql = /*sql*/ `
      UPDATE bolt_drivers_to_ban
      SET ${letter_column} = 1,  -- Using 0 for FALSE in SQLite
          updated_at = CURRENT_TIMESTAMP
      WHERE bitrix_deal_id = ?
      RETURNING bitrix_deal_id; -- This will only return if a row was actually updated
  `;
  //will return a bitrix id if the record has been found and successfully updated,
  //undefied in case of failure
  const returnedRow = (await db.get(sql, input)) || {};
  const { bitrix_deal_id } = returnedRow;
  return { bitrix_deal_id };
}

/**
 * Retrieves all drivers for whom the first letter has been sent.
 * @returns {Promise<Array<Object>>} - A promise that resolves with an array of driver records.
 */
export async function getBoltDriversFirstLetterSent() {
  const sql = /*sql*/ `
      SELECT driver_id, bolt_id, bitrix_deal_id, phone, is_first_letter_approved, is_second_letter_approved, created_at, updated_at
      FROM bolt_drivers_to_ban
      WHERE is_first_letter_approved = TRUE;
  `;
  return db.all(sql);
}

/**
 * Retrieves a specific driver by their driver_id.
 * @param {Object} params - The parameters for fetching the driver.
 * @param {string} params.driver_id - The ID of the driver.
 * @returns {Promise<Object|null>} - A promise that resolves with the driver record or null if not found.
 */
export async function getBoltDriverById({ driver_id }) {
  const sql = /*sql*/ `
      SELECT driver_id, bolt_id, bitrix_deal_id, phone, is_first_letter_approved, is_second_letter_approved, created_at, updated_at
      FROM bolt_drivers_to_ban
      WHERE driver_id = ?;
  `;
  return db.get(sql, driver_id);
}
/**
 * Retrieves all drivers to be banned.
 * @returns {Promise<Array<Object>>} - A promise that resolves with an array of driver records.
 */
export async function getALLBoltDriversToBan() {
  const sql = /*sql*/ `
      SELECT driver_id, bolt_id, bitrix_deal_id, phone, is_first_letter_approved, is_second_letter_approved
      FROM bolt_drivers_to_ban
      WHERE is_second_letter_approved = FALSE;
      ;
  `;
  return db.all(sql);
}
export const markReferralAsClosed = ({ referral_id }) => {
  const sql = `UPDATE referral SET is_closed = TRUE WHERE referral_id = ?`;
  return db.run(sql, [referral_id]);
};
export async function markManyDriversAsSent({ drivers }) {
  let ids = drivers.reduce((acc, curr) => {
    return (acc += `'${curr.driver_id}',`);
  }, '');

  ids = String(ids).slice(0, ids.length - 1);
  const sql = /*sql*/ `UPDATE bolt_drivers_to_ban SET is_second_letter_approved = TRUE WHERE driver_id in (${ids});`;

  await db.run(sql);
}
