import pg from 'pg';

export const pool = new pg.Pool({
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DB,
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
