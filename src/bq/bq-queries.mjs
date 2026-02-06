import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: process.env.DEV_DB,
  driver: sqlite3.Database,
});

/**
 * Get the most recent modified_at timestamp across all orders.
 */
export async function getMaxOrderModifiedAt() {
  const sql = /*sql*/ `
      SELECT MAX(modified_at) AS maxModifiedAt
        FROM remonline_orders
    `;
  const row = await db.get(sql);
  return row?.maxModifiedAt ?? 1;
}

/**
 * Synchronize orders in a single transaction:
 * 1) delete existing records for the given order_ids
 * 2) insert them again from JSON (returns an array of inserted rows)
 *
 * @param {{ orders: { id: number, modified_at?: string }[] }} params
 */
export async function synchronizeRemonlineOrders({ orders }) {
  // Convert to the shape we need for both delete and insert:
  const ordersArray = orders.map((o) => ({
    order_id: o.id,
    modified_at: o.modified_at ?? null,
  }));
  const json = JSON.stringify(ordersArray);

  // DELETE using json_each() instead of N placeholders:
  const deleteSql = /*sql*/ `
   DELETE FROM remonline_orders
   WHERE order_id IN (
     SELECT json_extract(value, '$.order_id')
     FROM json_each(?)
   )
 `;

  // INSERT exactly as before:
  const insertSql = /*sql*/ `
   INSERT INTO remonline_orders (order_id, modified_at)
   SELECT
     json_extract(value, '$.order_id'),
     COALESCE(json_extract(value, '$.modified_at'), CURRENT_TIMESTAMP)
   FROM json_each(?)
 `;

  // Wrap both in one transaction
  await db.exec('BEGIN TRANSACTION');
  try {
    // Delete all matching order_ids in one pass
    await db.run(deleteSql, json);

    // Re‑insert (or insert new) in one pass
    const insertedRows = await db.all(insertSql, json);

    // Commit if all went well
    await db.exec('COMMIT');
    return insertedRows;
  } catch (err) {
    // Roll back on any failure
    await db.exec('ROLLBACK');
    throw err;
  }
}
export async function getAllCampaignIds() {
  const sql = /*sql*/ `
      SELECT id
        FROM remonline_campaigns
  `;
  const rows = await db.all(sql);
  return rows.map((row) => row.id);
}
export async function getAllResourceIds() {
  const sql = /*sql*/ `
      SELECT id
        FROM remonline_order_resources
  `;
  const rows = await db.all(sql);
  return rows.map((row) => row.id);
}
export async function insertCampaignsBatch(campaigns) {
  if (!campaigns || campaigns.length === 0) return [];

  const insertSql = /*sql*/ `
    INSERT INTO remonline_campaigns (id)
    SELECT
      json_extract(value, '$.id')
    FROM json_each(?)
  `;

  // `campaigns` should be a JS array of objects like:
  // [{ id: 1 }, { id: 2 }, { id: 3 }]
  // We stringify it so json_each(?) can iterate the JSON array.
  const rows = await db.all(insertSql, JSON.stringify(campaigns));
  return rows; // Array of inserted campaign rows
}

export async function insertOrderResourcesBatch(resources) {
  if (!resources || resources.length === 0) return [];

  const insertSql = /*sql*/ `
    INSERT INTO remonline_order_resources (id)
    SELECT
      json_extract(value, '$.id')
    FROM json_each(?)
  `;
  const rows = await db.all(insertSql, JSON.stringify(resources));
  return rows; // Array of inserted campaign rows
}

export async function getMaxPostingCreatedAt() {
  const sql = /*sql*/ `
      SELECT MAX(created_at) AS maxCreatedAt
        FROM remonline_postings
    `;
  const row = await db.get(sql);
  return row?.maxCreatedAt ?? 0;
}

export async function synchronizeRemonlinePostings({ postings }) {
  if (!postings || postings.length === 0) return [];

  const postingsArray = postings.map((p) => ({
    posting_id: p.id,
    created_at: p.created_at,
  }));

  const json = JSON.stringify(postingsArray);

  const insertSql = /*sql*/ `
   INSERT OR IGNORE INTO remonline_postings (posting_id, created_at)
   SELECT
     json_extract(value, '$.posting_id'),
     json_extract(value, '$.created_at')
   FROM json_each(?)
 `;

  // Append-only: rely on PRIMARY KEY + INSERT OR IGNORE to prevent duplicates
  const insertedRows = await db.all(insertSql, json);
  return insertedRows;
}
