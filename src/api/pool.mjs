import pg from 'pg';
let connectionString = `postgres://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DB}`;
if (
  process.env.ENV === 'TEST' ||
  process.env.ENV === 'DEV' ||
  process.env.ENV === 'SET'
) {
  const encodedPassword = encodeURIComponent(process.env.PG_PASSWORD);
  connectionString = `postgres://${process.env.PG_USER}:${encodedPassword}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DB}`;
}

export const pool = new pg.Pool({
  connectionString,
});

pool.on('connect', () => {
  console.log('New client connected');
});

pool.on('remove', () => {
  console.log('Client removed');
});

process.on('SIGINT', async () => {
  console.log('SIGINT');
  await pool.end();
  console.log('pool closed');
  process.exit();
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM');
  await pool.end();
  console.log('pool closed');
  process.exit();
});

process.on('uncaughtException', async (error) => {
  console.error('uncaughtException:', error);
  await pool.end();
  console.log('pool closed');
  process.exit();
});

function getPoolState() {
  console.log({
    pool,
  });

  console.log({
    total: pool.totalCount, // Общее количество соединений в пуле
    idle: pool.idleCount, // Количество простаивающих соединений
    waiting: pool.waitingCount, // Количество ожидающих запросов
  });
}

if (process.env.ENV == 'TEST') {
  getPoolState();
}
