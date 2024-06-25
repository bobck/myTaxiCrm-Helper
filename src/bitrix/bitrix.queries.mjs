import sqlite3 from 'sqlite3';
import { open } from 'sqlite'

const db = await open({
    filename: process.env.DEV_DB,
    driver: sqlite3.Database
})

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
