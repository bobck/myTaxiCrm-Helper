import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
const db = await open({
  filename: process.env.DEV_DB,
  driver: sqlite3.Database,
});

export async function chatRoomsWithParkIds() {
  const sql = `
    WITH plan_trips as (
        SELECT 
        autopark_id,
        trips
        FROM plan
        where is_last_version = true
    )
    SELECT 
    ac.chat_id,
    json_group_array(ac.autopark_id) as autopark_ids,
    max(p.trips) as plan_trips
    FROM autoparks_chat ac
    LEFT JOIN plan_trips p ON p.autopark_id = ac.autopark_id
    GROUP BY chat_id`;

  const chatRooms = await db.all(sql);
  return { chatRooms };
}
