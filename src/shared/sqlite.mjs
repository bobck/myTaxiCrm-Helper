import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: process.env.DEV_DB,
  driver: sqlite3.Database,
});

await db.exec('PRAGMA journal_mode = WAL');
await db.exec('PRAGMA busy_timeout = 5000');
await db.exec('PRAGMA foreign_keys = ON');

// Serialize every write transaction on this single shared connection.
//
// sqlite3 serializes individual statements, but the `await` points between the
// statements of a transaction yield to the event loop. Two transactions that
// overlap in time (e.g. two cron jobs firing on the same minute) therefore
// interleave, the second `BEGIN` runs while the first transaction is still open,
// and SQLite throws "cannot start a transaction within a transaction".
//
// A promise-chained mutex makes each transaction wait for the previous one to
// COMMIT/ROLLBACK before it issues its own BEGIN, so transactions never nest.
// All BEGIN/COMMIT/ROLLBACK must go through this helper for the guarantee to hold.
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
  // Keep the queue alive even if this transaction rejects, so a single failure
  // doesn't wedge every subsequent transaction.
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
