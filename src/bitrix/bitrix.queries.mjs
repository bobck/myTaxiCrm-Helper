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
