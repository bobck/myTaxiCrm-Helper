
import pg from 'pg';
import fs from 'fs'

import { sendInfoToChatRoom } from '../telegram-utils.mjs'
import { chatRoomsWithParkIds } from '../telegram-query.mjs'

const { Client } = pg;

const conString = `postgres://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}/${process.env.PG_DB}`;

export async function startRoomsNotification() {
    const client = new Client(conString);
    const result = await client.connect();

    console.log({ time: new Date(), message: 'startRoomsNotification', result })

    const { chatRooms } = await chatRoomsWithParkIds();
    // console.log({ chatRooms })

    const sqlp = fs.readFileSync('./src/sql/online_data_by_parks.sql').toString();

    for (let room of chatRooms) {
        // console.log({ room })
        const { chat_id, autopark_ids, plan_trips } = room;

        if (!autopark_ids) {
            continue
        }

        const autopark_ids_json = JSON.parse(autopark_ids)
        const result = await client.query(sqlp, [autopark_ids_json])
        const { rows } = result

        const tripsCount = rows.reduce((accumulator, current) => {
            return accumulator + current.total_trips
        }, 0)

        sendInfoToChatRoom({ chat_id, plan_trips, tripsCount });
    }

    await client.end()
}

if (process.env.ENV == "TEST") {
    startRoomsNotification();
}
