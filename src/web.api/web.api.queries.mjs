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
