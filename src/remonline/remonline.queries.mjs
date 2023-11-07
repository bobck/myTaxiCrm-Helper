import sqlite3 from 'sqlite3';
import { open } from 'sqlite'

const db = await open({
    filename: process.env.DEV_DB,
    driver: sqlite3.Database
})

export async function getLastSidCreatedAt() {
    const sql = `SELECT max(created_at) as created_at from sids`
    const lastSidCreatedAt = await db.get(sql)
    return lastSidCreatedAt
}

export async function getSidsWithNoId() {
    const sql = `SELECT sid_lable FROM sids WHERE status_id IS NULL AND is_parsed = false GROUP BY sid_lable`
    return await db.all(sql)
}

export async function markSidsWithNoIdAsParsed({ idLabel }) {
    const sql = `UPDATE sids SET is_parsed = true WHERE sid_lable = ?`
    return await db.all(sql, idLabel)
}


export async function updateSidIdAndStatus({ id, statusId, isClosed, idLabel }) {
    const sql = `UPDATE sids SET sid_id = ?, status_id = ?,is_closed = ? WHERE sid_lable = ?`
    await db.run(
        sql, id, statusId, isClosed, idLabel
    )
}

export async function updateSidStatus({ statusId, isClosed, id }) {
    const sql = `UPDATE sids SET status_id = ?,is_closed = ? WHERE sid_id = ?`
    await db.run(
        sql, statusId, isClosed, id
    )
}

export async function getSidsNotReadyDoBeClosed({ statusesToBeClosed }) {
    const sql = `SELECT sid_id,status_id FROM sids WHERE is_closed = false AND status_id NOT IN (${statusesToBeClosed}) GROUP BY sid_id`
    return await db.all(sql)
}

export async function getSidsReadyToBeClosed({ statusesToBeClosed }) {
    const sql = `SELECT sid_id,sid_lable FROM sids WHERE is_closed = false AND status_id IN (${statusesToBeClosed}) AND is_closed = false GROUP BY sid_id`
    return await db.all(sql)
}

export async function markSidsAsClosed({ statusId, id }) {
    const sql = `UPDATE sids SET is_closed = true, status_id = ? WHERE sid_id = ?`
    return await db.all(sql, statusId, id)
}



export async function saveRemonlineToken({ token, validTo }) {//
    const sql = `INSERT INTO remonline_tokens(token, valid_to) VALUES(?,?)`
    await db.run(
        sql,
        token,
        validTo
    )
}

export async function getRemonlineToken({ now }) {
    const sql = `SELECT token FROM remonline_tokens WHERE valid_to > ? ORDER BY created_at DESC LIMIT 1 `
    return await db.get(sql, now)
}