import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: process.env.DEV_DB,
  driver: sqlite3.Database,
});

await db.exec('PRAGMA foreign_keys = ON;');

export async function savePrivateRemonlineTokens({ refreshToken, accessToken }) {
  const sql = `INSERT INTO remonline_private_api_tokens (refresh_token, access_token)
    VALUES (?, ?)`;
  await db.run(sql, refreshToken, accessToken);
}

export async function getLatestPrivateRemonlineTokens() {
  const sql = `SELECT id, refresh_token as refreshToken, access_token as accessToken, created_at as createdAt
    FROM remonline_private_api_tokens
    ORDER BY created_at DESC, id DESC
    LIMIT 1`;

  return await db.get(sql);
}

