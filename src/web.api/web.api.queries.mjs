import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: process.env.DEV_DB,
  driver: sqlite3.Database,
});

export async function saveCreatedDriverCustomTariffId({ tariffId, driverId }) {
  const sql = `INSERT INTO drivers_custom_tariff_ids(tariff_id, driver_id) VALUES(?,?)`;
  await db.run(sql, tariffId, driverId);
}

export async function getUndeletedDriversCustomTariffIds() {
  const sql = `SELECT tariff_id,driver_id FROM drivers_custom_tariff_ids WHERE is_deleted = false`;
  const undeletedDriversCustomTariffIds = await db.all(sql);
  return { undeletedDriversCustomTariffIds };
}

export async function markDriverCustomTariffAsDeleted({ tariffId }) {
  const sql = `UPDATE drivers_custom_tariff_ids SET is_deleted=true WHERE tariff_id = ?`;
  await db.run(sql, tariffId);
}

export async function saveCreatedDriverBonusRuleId({
  autoParkId,
  driverId,
  bonusRuleId,
}) {
  const sql = `INSERT INTO drivers_custom_bonus_rules_ids(auto_park_id, driver_id,bonus_rule_id) VALUES(?,?,?)`;
  await db.run(sql, autoParkId, driverId, bonusRuleId);
}

export async function getUndeletedDriversCustomBonuses() {
  const sql = `SELECT auto_park_id,bonus_rule_id FROM drivers_custom_bonus_rules_ids WHERE is_deleted = false AND is_not_found = false`;
  const undeletedDriversCustomBonuses = await db.all(sql);
  return { undeletedDriversCustomBonuses };
}

export async function markDriverCustomBonusRulesAsDeleted({ bonusRuleId }) {
  const sql = `UPDATE drivers_custom_bonus_rules_ids SET is_deleted=true WHERE bonus_rule_id = ?`;
  await db.run(sql, bonusRuleId);
}

export async function markDriverCustomBonusRulesAsNotFound({ bonusRuleId }) {
  const sql = `UPDATE drivers_custom_bonus_rules_ids SET is_not_found=true WHERE bonus_rule_id = ?`;
  await db.run(sql, bonusRuleId);
}

export async function getNotFoundDriversCustomBonuses() {
  const sql = `SELECT driver_id,bonus_rule_id FROM drivers_custom_bonus_rules_ids WHERE is_not_found = true AND is_deleted = false`;
  const notFoundDriversCustomBonuses = await db.all(sql);
  return { notFoundDriversCustomBonuses };
}

export async function replaceOldDriverCustomBonusRulesWithNewId({
  bonusRuleId,
  newBonusRuleId,
}) {
  const sql = `UPDATE drivers_custom_bonus_rules_ids SET bonus_rule_id=?,is_not_found=false WHERE bonus_rule_id = ?`;
  await db.run(sql, newBonusRuleId, bonusRuleId);
}

export async function markDriverCustomBonusRulesIsUnDeletedle({ bonusRuleId }) {
  const sql = `UPDATE drivers_custom_bonus_rules_ids SET is_deleted=null WHERE bonus_rule_id = ?`;
  await db.run(sql, bonusRuleId);
}

export async function saveCreatedCashlessApplicationId({
  id,
  autoParkId,
  remonlineTransactionId,
}) {
  const sql = `INSERT INTO cashless_payments_applications(id, auto_park_id,remonline_transaction_id) VALUES(?,?,?)`;
  await db.run(sql, id, autoParkId, remonlineTransactionId);
}

export async function updateSavedCashlessApplicationId({ id, status }) {
  const sql = `UPDATE cashless_payments_applications SET status=? WHERE id = ?`;
  await db.run(sql, status, id);
}

export async function insertContractors(contractorsList) {
  await db.exec('DELETE FROM contractors');
  await db.exec('BEGIN TRANSACTION');
  try {
    for (const contractor of contractorsList) {
      await db.run(
        'INSERT INTO contractors (id,name) VALUES (?,?)',
        contractor.id,
        contractor.name
      );
    }
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    console.error('Ошибка при вставке данных:', error);
  }
}

export async function getContractorIdByName(contractorName) {
  const sql = `SELECT id FROM contractors WHERE name = ?`;
  return await db.get(sql, contractorName);
}

export async function insertDriversWithRevenue(driversWithRevenue) {
  await db.exec('BEGIN TRANSACTION');
  try {
    for (const driver of driversWithRevenue) {
      const {
        company_id,
        auto_park_id,
        driver_id,
        phone,
        auto_park_revenue,
        rides_count,
      } = driver;
      await db.run(
        'INSERT INTO drivers_revenue (company_id,auto_park_id,driver_id,phone,auto_park_revenue,rides_count) VALUES (?,?,?,?,?,?)',
        company_id,
        auto_park_id,
        driver_id,
        phone,
        auto_park_revenue,
        rides_count
      );
    }
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    console.error('Ошибка при вставке данных:', error);
  }
}

export async function getExistedDriversWithRevenue(driverIds) {
  const placeholders = driverIds.map(() => '?').join(',');
  const sql = `SELECT driver_id,auto_park_revenue,rides_count FROM drivers_revenue WHERE driver_id IN (${placeholders})`;
  const existedDriversWithRevenue = await db.all(sql, driverIds);
  return { existedDriversWithRevenue };
}

export async function updateExistedDriversWithRevenue(
  updatedExistedDriversWithRevenue
) {
  await db.exec('BEGIN TRANSACTION');
  try {
    for (const driver of updatedExistedDriversWithRevenue) {
      const { driver_id, auto_park_revenue, rides_count } = driver;
      await db.run(
        'UPDATE drivers_revenue SET auto_park_revenue = ?, rides_count = ?, updated_at = CURRENT_TIMESTAMP WHERE driver_id = ?',
        auto_park_revenue,
        rides_count,
        driver_id
      );
    }
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    console.error('Ошибка при вставке данных:', error);
  }
}
export const getDriversWithActiveCashBlockRules = () => {
  const sql = `SELECT driver_id,driver_cash_block_rule_id FROM driver_cash_block_rules WHERE is_deleted=FALSE`;
  return db.all(sql);
};
export const insertDriverWithCashBlockRules = ({
  driver_id,
  driver_cash_block_rule_id,
}) => {
  const sql = `INSERT INTO driver_cash_block_rules(driver_id,driver_cash_block_rule_id) VALUES(?,?)`;
  return db.run(sql, driver_id, driver_cash_block_rule_id);
};
export const markDriverCashBlockRulesAsDeleted = ({ driver_id }) => {
  const sql = `UPDATE driver_cash_block_rules SET is_deleted=true WHERE driver_id = ?`;
  return db.run(sql, driver_id);
};
export const getDriversIgnoringCashBlockRules = () => {
  const sql = `SELECT driver_id FROM drivers_ignoring_cash_block_rules WHERE is_active=TRUE`;
  return db.all(sql);
};
/**
 * Deactivates a batch of drivers by setting their 'is_active' flag to false
 * and updating their 'updated_at' timestamp.
 *
 * This function uses the 'sqlite' promise-based wrapper.
 *
 * @param {string[]} driverIds An array of driver UUIDs to deactivate.
 * @returns {Promise<object>} A promise that resolves with the result object from the db driver,
 * which contains 'changes' for the number of affected rows.
 * @throws {Error} Throws an error if the update fails or if driverIds is invalid.
 */
export async function deactivateDriversIgnoringDCBR(driverIds) {
  if (!Array.isArray(driverIds)) {
    throw new Error('Input must be a non-empty array of driver IDs.');
  }
  if (driverIds.length === 0) {
    return;
  }
  const placeholders = driverIds.map(() => '?').join(',');
  const sql = `
    UPDATE drivers_ignoring_cash_block_rules
    SET
      is_active = 0,
      updated_at = CURRENT_TIMESTAMP
    WHERE
      driver_id IN (${placeholders})
  `;

  const result = await db.run(sql, driverIds);
  return result;
}
/**
 * Creates new drivers from an array of driver IDs, setting them as active.
 *
 * This function uses a transaction to ensure all drivers are created atomically.
 *
 * @param {string[]} driverIds An array of driver UUIDs to create.
 * @returns {Promise<number>} A promise that resolves with the number of newly created drivers.
 * @throws {Error} Throws an error if the transaction fails or if driverIds is invalid.
 */
export async function createDriversIgnoringDCBR(driverIds) {
  if (!Array.isArray(driverIds)) {
    throw new Error('Input must be a non-empty array of driver IDs.');
  }
  if (driverIds.length === 0) {
    return;
  }

  const sql = `
    INSERT INTO drivers_ignoring_cash_block_rules (driver_id, is_active, created_at, updated_at)
    VALUES (?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;
  let createdCount = 0;

  try {
    await db.exec('BEGIN TRANSACTION');

    const stmt = await db.prepare(sql);

    for (const id of driverIds) {
      const result = await stmt.run(id);
      createdCount += result.changes;
    }

    await stmt.finalize();
    await db.exec('COMMIT');

    return createdCount;
  } catch (err) {
    console.error('Transaction failed, rolling back.', err.message);
    await db.exec('ROLLBACK');
    throw err;
  }
}

export const getAutoParksExcludedFromCashBlockRules = () => {
  const sql = `SELECT auto_park_id FROM auto_parks_excluded_from_cash_block_rules WHERE is_active=TRUE`;
  return db.all(sql);
};

export async function deactivateAutoParksExcludedFromDCBR(autoParkIds) {
  if (!Array.isArray(autoParkIds)) {
    throw new Error('Input must be a non-empty array of auto park IDs.');
  }
  if (autoParkIds.length === 0) {
    return;
  }
  const placeholders = autoParkIds.map(() => '?').join(',');
  const sql = `
    UPDATE auto_parks_excluded_from_cash_block_rules
    SET
      is_active = 0,
      updated_at = CURRENT_TIMESTAMP
    WHERE
      auto_park_id IN (${placeholders})
  `;

  const result = await db.run(sql, autoParkIds);
  return result;
}

export async function createAutoParksExcludedFromDCBR(autoParkIds) {
  if (!Array.isArray(autoParkIds)) {
    throw new Error('Input must be a non-empty array of auto park IDs.');
  }
  if (autoParkIds.length === 0) {
    return;
  }

  const sql = `
    INSERT INTO auto_parks_excluded_from_cash_block_rules (auto_park_id, is_active, created_at, updated_at)
    VALUES (?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;
  let createdCount = 0;

  try {
    await db.exec('BEGIN TRANSACTION');

    const stmt = await db.prepare(sql);

    for (const id of autoParkIds) {
      const result = await stmt.run(id);
      createdCount += result.changes;
    }

    await stmt.finalize();
    await db.exec('COMMIT');

    return createdCount;
  } catch (err) {
    console.error('Transaction failed, rolling back.', err.message);
    await db.exec('ROLLBACK');
    throw err;
  }
}


export const getAutoParkCustomCashBlockRules = () => {
  const sql = `SELECT * FROM auto_park_custom_cash_block_rules WHERE is_active=TRUE`;
  return db.all(sql);
};



export async function synchronizeAutoParkRulesTransaction({ newAutoParkRules, deletedAutoParkRuleIds }) {
  try {
    // Start the transaction
    await db.run('BEGIN TRANSACTION;');

    // Step 1: Deactivate rules based on the deletedAutoParkRules array.
    // This will set is_active to false for all existing rules matching the auto_park_id.
    if (deletedAutoParkRuleIds && deletedAutoParkRuleIds.length > 0) {
      const placeholders = deletedAutoParkRuleIds.map(() => '?').join(',');
      const updateSql = `
        UPDATE auto_park_custom_cash_block_rules
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE rule_id IN (${placeholders});
      `;
      await db.run(updateSql, deletedAutoParkRuleIds);
    }

    // Step 2: Insert all new rules from the newAutoParkRules array.
    // Since auto_park_id can be repeated, we perform a simple insert for each new rule.
    if (newAutoParkRules && newAutoParkRules.length > 0) {
      const insertSql = `
        INSERT INTO auto_park_custom_cash_block_rules
        (auto_park_id, mode, target, balanceActivationValue, depositActivationValue, maxDebt)
        VALUES (?, ?, ?, ?, ?, ?);
      `;

      // For optimal performance, a database driver's "prepare" statement method
      // should be used before looping to execute the same query multiple times.
      for (const rule of newAutoParkRules) {
        const params = [
          rule.auto_park_id,
          rule.mode,
          rule.target,
          rule.balanceActivationValue,
          rule.depositActivationValue,
          rule.maxDebt,
        ];
        await db.run(insertSql, params);
      }
    }

    // Commit the transaction if all operations succeed
    await db.run('COMMIT;');

  } catch (error) {
    // If any error occurs, rollback the entire transaction
    console.error('Error during synchronization, rolling back transaction.', error);
    await db.run('ROLLBACK;');
    // Re-throw the error so the calling code is aware of the failure
    throw error;
  }
}