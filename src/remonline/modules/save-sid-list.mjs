import fs from 'fs';
import { saveSidRow } from '../remonline.utils.mjs';
import { getLastSidCreatedAt } from '../remonline.queries.mjs';
import { pool } from '../../api/pool.mjs';

export async function saveSidList() {
  let lastSidCreatedAt;

  const { created_at } = await getLastSidCreatedAt();
  lastSidCreatedAt = new Date(created_at);
  if (!created_at) {
    lastSidCreatedAt = process.env.SID_START_DATE;
  }
  if (created_at) {
    lastSidCreatedAt = new Date(created_at + 1);
  }

  console.log({ time: new Date(), message: 'saveSidList', lastSidCreatedAt });

  const sql = fs.readFileSync('./src/sql/sid_list.sql').toString();

  const result = await pool.query(sql, [lastSidCreatedAt]);
  const { rows } = result;

  if (rows.length == 0) {
    return;
  }
  console.log(`${rows.length} sid to save`);

  for (let row of rows) {
    const { id, auto_park_id, created_at, purpose, comment, sid_lable } = row;

    await saveSidRow({
      id,
      auto_park_id,
      created_at,
      purpose,
      comment,
      sid_lable,
    });
  }
}

if (process.env.ENV == 'TEST') {
  await saveSidList();
}
