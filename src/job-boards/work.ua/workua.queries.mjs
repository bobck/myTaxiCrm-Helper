import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: process.env.DEV_DB, // Убедитесь, что это правильный путь к вашей базе данных Work.ua
  driver: sqlite3.Database,
});

/**
 * Creates a new vacancy record in the work_ua_pagination table.
 * Other fields will be initialized with default or NULL values.
 * @param {object} params - The parameters for the new vacancy.
 * @param {string} params.vacancy_id - The unique ID of the vacancy.
 * @param {string} params.vacancy_name - The name of the vacancy.
 * @param {string} params.vacancy_date - The date of the vacancy.
 */
export async function createWorkUaVacancy({
  vacancy_id,
  vacancy_name,
  vacancy_date,
}) {
  const sql = `INSERT INTO work_ua_pagination
                    (vacancy_id, vacancy_name, vacancy_date)
                VALUES
                    (?, ?, ?)`;
  await db.run(sql, vacancy_id, vacancy_name, vacancy_date);
}

/**
 * Updates the last processed application ID for a specific Work.ua vacancy.
 * It also automatically updates the 'updated_date' to the current timestamp.
 * @param {object} params - The parameters for the update.
 * @param {string} params.vacancy_id - The ID of the vacancy to update.
 * @param {number} params.last_apply_id - The new last application ID.
 */
export async function updateWorkUaVacancyProgress({
  vacancy_id,
  last_apply_id,
}) {
  const sql = `UPDATE
                    work_ua_pagination
                SET
                    last_apply_id = ?,
                    updated_date = CURRENT_TIMESTAMP
                WHERE
                    vacancy_id = ?`;
  await db.run(sql, last_apply_id, vacancy_id);
}

/**
 * Retrieves the pagination data (last apply ID) for a given Work.ua vacancy.
 * @param {object} params - The parameters for the query.
 * @param {string} params.vacancy_id - The ID of the vacancy to retrieve pagination for.
 * @returns {Promise<object|undefined>} An object containing last_apply_id, or undefined if not found.
 */
export async function getWorkUaPagination({ vacancy_id }) {
  const sql = `SELECT
                    last_apply_id
                FROM
                    work_ua_pagination
                WHERE
                    vacancy_id = ?`;
  const pagination = await db.get(sql, vacancy_id);
  return pagination;
}

export async function getAllWorkUaVacancyIds() {
  const sql = `SELECT
                    vacancy_id
                FROM
                    work_ua_pagination
                WHERE
                    is_active = FALSE`;
  const vacancyIds = await db.all(sql);
  return vacancyIds;
}

/**
 * Marks a Work.ua vacancy as active by setting the is_active flag to TRUE.
 * It also automatically updates the 'updated_date' to the current timestamp.
 * @param {object} params - The parameters for the operation.
 * @param {string} params.work_ua_vacancy_id - The ID of the vacancy to mark as .
 */
export async function markWorkUaVacancyAsActive({ work_ua_vacancy_id }) {
  const sql = /*sql*/ `UPDATE
                    work_ua_pagination
                SET
                    is_active = TRUE
                WHERE
                    work_ua_vacancy_id = ?`;
  await db.run(sql, work_ua_vacancy_id);
}

export async function markManyWorkUaVacanciesAsActive({ vacancy_ids }) {
  if (!vacancy_ids || vacancy_ids.length === 0) {
    return; // No IDs to process
  }

  const placeholders = vacancy_ids.map(() => '?').join(',');

  const sql = `UPDATE
                    work_ua_pagination
                SET
                    is_active = TRUE,
                    updated_date = CURRENT_TIMESTAMP
                WHERE
                    vacancy_id IN (${placeholders})`;
  await db.run(sql, ...vacancy_ids);
}

export async function getAllActiveWorkUaVacancies() {
  const sql = `SELECT * from work_ua_pagination where is_active = FALSE`;
  const activeVacancies = await db.all(sql);
  return { activeVacancies };
}
export const getLastWorkUaVaccancyApply = async ({ vacancy_id }) => {
  const sql = `SELECT
                    last_apply_id
                FROM
                    work_ua_pagination
                WHERE
                    vacancy_id = ?`;
  const lastApplyId = await db.get(sql, vacancy_id);
  return lastApplyId;
};
export const createWorkUaSynchronizedVacancy = async ({
  bitrix_vacancy_id,
  work_ua_vacancy_id,
  is_active,
}) => {
  const sql = `INSERT INTO work_ua_pagination (bitrix_vacancy_id,work_ua_vacancy_id,is_active) VALUES (?,?,?)`;

  await db.run(sql, bitrix_vacancy_id, work_ua_vacancy_id, is_active);
};
