import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: process.env.DEV_DB,
  driver: sqlite3.Database,
});

await db.exec('PRAGMA foreign_keys = ON;');

export async function getLastSidCreatedAt() {
  const sql = `SELECT max(created_at) as created_at from sids`;
  const lastSidCreatedAt = await db.get(sql);
  return lastSidCreatedAt;
}

export async function getSidsWithNoId() {
  const sql = `SELECT sid_lable FROM sids WHERE status_id IS NULL AND is_parsed = false GROUP BY sid_lable`;
  return await db.all(sql);
}

export async function markSidsWithNoIdAsParsed({ idLabel }) {
  const sql = `UPDATE sids SET is_parsed = true WHERE sid_lable = ?`;
  return await db.all(sql, idLabel);
}

export async function updateSidIdAndStatus({
  id,
  statusId,
  isClosed,
  idLabel,
}) {
  const sql = `UPDATE sids SET sid_id = ?, status_id = ?,is_closed = ? WHERE sid_lable = ?`;
  await db.run(sql, id, statusId, isClosed, idLabel);
}

export async function updateSidStatus({ statusId, isClosed, id }) {
  const sql = `UPDATE sids SET status_id = ?,is_closed = ? WHERE sid_id = ?`;
  await db.run(sql, statusId, isClosed, id);
}

export async function getSidsNotReadyDoBeClosed({ statusesToBeClosed }) {
  const sql = `SELECT sid_id,status_id FROM sids WHERE is_closed = false AND status_id NOT IN (${statusesToBeClosed}) GROUP BY sid_id`;
  return await db.all(sql);
}

export async function getSidsReadyToBeClosed({ statusesToBeClosed }) {
  const sql = `SELECT sid_id,sid_lable FROM sids WHERE is_closed = false AND status_id IN (${statusesToBeClosed}) AND is_closed = false GROUP BY sid_id`;
  return await db.all(sql);
}

export async function markSidsAsClosed({ statusId, id }) {
  const sql = `UPDATE sids SET is_closed = true, status_id = ? WHERE sid_id = ?`;
  return await db.all(sql, statusId, id);
}

export async function saveRemonlineToken({ token, validTo }) {
  //
  const sql = `INSERT INTO remonline_tokens(token, valid_to) VALUES(?,?)`;
  await db.run(sql, token, validTo);
}

export async function getRemonlineToken({ now }) {
  const sql = `SELECT token FROM remonline_tokens WHERE valid_to > ? ORDER BY created_at DESC LIMIT 1 `;
  return await db.get(sql, now);
}

export async function getCaboxesWithCrmMapping() {
  const sql = `SELECT id,last_transaction_created_at,auto_park_id,auto_park_cashbox_id,default_contator_id,usa_contator_id,scooter_contator_id FROM remonline_cashboxes WHERE is_enabled = TRUE`;
  return await db.all(sql);
}

export async function updateLastCreatedTransactionTimeFoxRemonlineCashbox({
  createdAt,
  remonlineCashboxId,
}) {
  const sql = `UPDATE remonline_cashboxes SET last_transaction_created_at = ? WHERE id = ?`;
  return await db.all(sql, createdAt, remonlineCashboxId);
}

export async function getCaboxesWithCrmMappingThatDontExistInBQ() {
  const sql = `SELECT id,last_transaction_created_at,auto_park_id,auto_park_cashbox_id,default_contator_id,usa_contator_id,scooter_contator_id FROM remonline_cashboxes WHERE is_enabled = TRUE and is_present_in_bq = FALSE`;
  return await db.all(sql);
}

export async function getCashFlowItemIdsThatExistInBQ() {
  const sql = `SELECT id FROM remonline_cashflow_items WHERE is_present_in_bq = TRUE`;
  return await db.all(sql);
}
export async function markCashboxAsSynchronizedWithBQ({ remonlineCashboxIds }) {
  if (!remonlineCashboxIds.length) return;

 const placeholders = remonlineCashboxIds.map(() => '?').join(',');

  const sql = `UPDATE remonline_cashboxes SET is_present_in_bq = 1 WHERE id IN (${placeholders})`;

  return await db.run(sql, remonlineCashboxIds);
}

export async function createCashflowItemsSynchronizedWithBQ({ token, validTo }) {
  //
  const sql = `INSERT INTO remonline_cashflow_items(id, valid_to) VALUES(?,?)`;
  await db.run(sql, token, validTo);
}


export async function createBatchCashflowItems(items) {
  if (!items.length) return;

  const placeholders = items.map(() => '(?, ?, ?, 1)').join(', ');

  const values = items.flatMap((item) => [item.id, item.name, item.direction]);

  const sql = `
    INSERT INTO remonline_cashflow_items (id, name, direction, is_present_in_bq)
    VALUES ${placeholders}
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      direction=excluded.direction,
      is_present_in_bq=1;
  `;

  return await db.run(sql, values);
}