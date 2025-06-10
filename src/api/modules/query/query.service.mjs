import { pool } from '../../pool.mjs';
export const executeQuery = async ({ sql }) => {
  const result = await pool.query(sql);

  const { rows } = result;

  return { rows };
};
