import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: process.env.DEV_DB,
  driver: sqlite3.Database,
});

await db.exec('PRAGMA journal_mode = WAL');
await db.exec('PRAGMA busy_timeout = 5000');
await db.exec('PRAGMA foreign_keys = ON');

let txChain = Promise.resolve();

export function runInTransaction(work) {
  const result = txChain.then(async () => {
    await db.exec('BEGIN TRANSACTION');
    try {
      const value = await work();
      await db.exec('COMMIT');
      return value;
    } catch (error) {
      try {
        await db.exec('ROLLBACK');
      } catch (rollbackError) {
        console.error('ROLLBACK failed', rollbackError);
      }
      throw error;
    }
  });
  txChain = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

process.on('SIGINT', async () => {
  console.log('SIGINT');
  await db.close();
  console.log('sqlite closed');
  process.exit();
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM');
  await db.close();
  console.log('sqlite closed');
  process.exit();
});

process.on('uncaughtException', async (error) => {
  console.error('uncaughtException:', error);
  await db.close();
  console.log('sqlite closed');
  process.exit();
});

export { db };
