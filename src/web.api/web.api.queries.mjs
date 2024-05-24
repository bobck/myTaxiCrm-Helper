import sqlite3 from 'sqlite3';
import { open } from 'sqlite'

const db = await open({
    filename: process.env.DEV_DB,
    driver: sqlite3.Database
})

export async function saveCreatedDriverCustomTariffId({ tariffId, driverId }) {
    const sql = `INSERT INTO drivers_custom_tariff_ids(tariff_id, driver_id) VALUES(?,?)`
    await db.run(
        sql,
        tariffId,
        driverId
    )
}

export async function getUndeletedDriversCustomTariffIds() {
    const sql = `SELECT tariff_id,driver_id FROM drivers_custom_tariff_ids WHERE is_deleted = false`
    const undeletedDriversCustomTariffIds = await db.all(sql)
    return { undeletedDriversCustomTariffIds }
}

export async function markDriverCustomTariffAsDeleted({ tariffId }) {
    const sql = `UPDATE drivers_custom_tariff_ids SET is_deleted=true WHERE tariff_id = ?`
    await db.run(
        sql,
        tariffId
    )
}

export async function saveCreatedDriverBonusRuleId({ autoParkId, driverId, bonusRuleId }) {
    const sql = `INSERT INTO drivers_custom_bonus_rules_ids(auto_park_id, driver_id,bonus_rule_id) VALUES(?,?,?)`
    await db.run(
        sql,
        autoParkId, driverId, bonusRuleId
    )
}


export async function getUndeletedDriversCustomBonuses() {
    const sql = `SELECT auto_park_id,bonus_rule_id FROM drivers_custom_bonus_rules_ids WHERE is_deleted = false`
    const undeletedDriversCustomBonuses = await db.all(sql)
    return { undeletedDriversCustomBonuses }
}

export async function markDriverCustomBonusRulesAsDeleted({ bonusRuleId }) {
    const sql = `UPDATE drivers_custom_bonus_rules_ids SET is_deleted=true WHERE bonus_rule_id = ?`
    await db.run(
        sql,
        bonusRuleId
    )
}

export async function saveCreatedCashlessApplicationId({ id, autoParkId, remonlineTransactionId }) {
    const sql = `INSERT INTO cashless_payments_applications(id, auto_park_id,remonline_transaction_id) VALUES(?,?,?)`
    await db.run(
        sql,
        id, autoParkId, remonlineTransactionId
    )
}

export async function updateSavedCashlessApplicationId({ id, status }) {
    const sql = `UPDATE cashless_payments_applications SET status=? WHERE id = ?`
    await db.run(
        sql,
        status,
        id
    )
}

export async function insertContractors(contractorsList) {
    await db.exec('DELETE FROM contractors');
    await db.exec('BEGIN TRANSACTION');
    try {
        for (const contractor of contractorsList) {
            await db.run('INSERT INTO contractors (id,name) VALUES (?,?)', contractor.id, contractor.name);
        }
        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Ошибка при вставке данных:', error);
    }
}

export async function getContractorIdByName(contractorName) {
    const sql = `SELECT id FROM contractors WHERE name = ?`
    return await db.get(sql, contractorName)
}