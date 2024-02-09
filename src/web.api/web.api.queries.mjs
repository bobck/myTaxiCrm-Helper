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