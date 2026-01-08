const INTERNAL_PG_USER = process.env.INTERNAL_PG_USER;
const INTERNAL_PG_PASSWORD = process.env.INTERNAL_PG_PASSWORD;
const INTERNAL_PG_HOST = process.env.INTERNAL_PG_HOST;
const INTERNAL_PG_PORT = process.env.INTERNAL_PG_PORT;

const getUrl = (dbName) => {
  return `postgresql://${INTERNAL_PG_USER}:${encodeURIComponent(INTERNAL_PG_PASSWORD)}@${INTERNAL_PG_HOST}:${INTERNAL_PG_PORT}/${dbName}`;
};
