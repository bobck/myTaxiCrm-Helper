
import pg from 'pg';

const connectionString = `postgres://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}/${process.env.PG_DB}`;

export const pool = new pg.Pool({
    connectionString
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


