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
 * Bulk‑create orders by passing a JSON array of objects like:
 *   [
 *     { "order_id": 123,           "modified_at": "2025-04-15 12:34:56" },
 *     { "order_id": 124 }  // modified_at will default to CURRENT_TIMESTAMP
 *   ]
 */
export async function createMultipleRemonlineOrders({ orders }) {
  const ordersArray = orders.map((order) => {
    return {
      order_id: order.id,
      modified_at: order.modified_at ?? null,
    };
  });
  const json = JSON.stringify(ordersArray);
  const sql = /*sql*/ `
      INSERT INTO remonline_orders (order_id, modified_at)
      SELECT
        json_extract(value, '$.order_id'),
        COALESCE(json_extract(value, '$.modified_at'), CURRENT_TIMESTAMP)
      FROM json_each(?)
      RETURNING *
    `;
  // returns an array of the newly inserted rows
  return db.all(sql, json);
}

/**
 * Delete multiple orders by passing an array of order_ids, e.g. [123, 124, 125].
 */
export async function deleteMultipleRemonlineOrders({ orders }) {
  const orderIds = orders.map((order) => order.id);
  if (!orderIds.length) {
    return [];
  }
  const placeholders = orderIds.map(() => '?').join(', ');
  const sql = /*sql*/ `
      DELETE FROM remonline_orders
      WHERE order_id IN (${placeholders})
      RETURNING *
    `;
  // returns an array of the deleted rows
  return db.all(sql, ...orderIds);
}
