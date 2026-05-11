import { db } from '../shared/sqlite.mjs';
import prisma from './remonline.prisma.mjs';

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

/**
 * Read sync progress for a named entity (e.g. 'Order', 'OrderItem'). If the
 * row doesn't exist yet, create it with an empty `syncDetails` and return
 * that — so the entity always materializes in the table on first read.
 *
 * @param {string} entityName
 * @returns {Promise<Record<string, any>>}
 */
export async function getEntitySync(entityName) {
  let row = await prisma.entitySync.findUnique({ where: { entityName } });
  if (!row) {
    try {
      row = await prisma.entitySync.create({
        data: { entityName, syncDetails: {} },
      });
    } catch (e) {
      // Race: another writer inserted the same row between our find and
      // create. Re-read instead of bubbling up the unique-constraint error.
      row = await prisma.entitySync.findUnique({ where: { entityName } });
      if (!row) throw e;
    }
  }
  return row.syncDetails;
}

/**
 * Persist new sync progress for an entity. `syncDetails` is stored as JSON
 * verbatim — callers own its shape (e.g. `{ last_modified_at }`).
 */
export async function upsertEntitySync(entityName, syncDetails) {
  await prisma.entitySync.upsert({
    where: { entityName },
    create: { entityName, syncDetails },
    update: { syncDetails },
  });
}
