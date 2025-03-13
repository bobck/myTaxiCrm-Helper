import fs from 'fs';

import { sendInfoToChatRoom } from '../telegram-utils.mjs';
import { chatRoomsWithParkIds } from '../telegram-query.mjs';
import { pool } from '../../api/pool.mjs';

export async function startRoomsNotification() {
  console.log({ time: new Date(), message: 'startRoomsNotification' });

  const { chatRooms } = await chatRoomsWithParkIds();

  const sqlp = fs.readFileSync('./src/sql/online_data_by_parks.sql').toString();

  for (let room of chatRooms) {
    const { chat_id, autopark_ids, plan_trips } = room;

    if (!autopark_ids) {
      continue;
    }

    const autopark_ids_json = JSON.parse(autopark_ids);
    const result = await pool.query(sqlp, [autopark_ids_json]);
    const { rows } = result;

    const tripsCount = rows.reduce((accumulator, current) => {
      return accumulator + current.total_trips;
    }, 0);

    sendInfoToChatRoom({ chat_id, plan_trips, tripsCount });
  }
}

if (process.env.ENV == 'TEST') {
  startRoomsNotification();
}
