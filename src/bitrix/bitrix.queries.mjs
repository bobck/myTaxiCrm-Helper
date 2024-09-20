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

export async function clearManifoldDealsTable() {
    const sql = `DELETE FROM manifold_deals WHERE ID IS NOT NULL`
    await db.run(sql)
}

export async function insertManifoldDeals(manifoldDeals) {
    await db.exec('BEGIN TRANSACTION');
    try {
        for (const deal of manifoldDeals) {
            const { id, deal_created_at, stage_id } = deal
            await db.run('INSERT INTO manifold_deals (id,deal_created_at,stage_id) VALUES (?,?,?)', id, deal_created_at, stage_id);
        }
        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Ошибка при вставке данных:', error);
    }
}

export async function getSavedManifoldDeals() {
    const sql = `SELECT id,accident_id,aviable_for_office_only,contact_id,contact_phone,deal_created_at FROM manifold_deals`;
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