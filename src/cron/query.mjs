import sqlite3 from 'sqlite3';
import { open } from 'sqlite'
const db = await open({
    filename: process.env.DEV_DB,
    driver: sqlite3.Database
})

export async function chatRoomsWithParkIds() {
    const sql = `SELECT 
    chat_id,
    json_group_array(autopark_id) as autopark_ids,
    spreadsheet_id,
    sheet_name 
    FROM autoparks_chat
    GROUP BY chat_id,spreadsheet_id,sheet_name`

    const chatRooms = await db.all(sql)
    return { chatRooms }
}
