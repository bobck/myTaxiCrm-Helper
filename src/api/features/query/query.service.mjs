import { pool } from '../../pool.mjs';
export const executeQuery = async ({ sql }) => {
  console.log('querying...', { sql });

  const result = await pool.query(sql);

  const { rows } = result;
    console.log({rows})
  return { rows };
};
