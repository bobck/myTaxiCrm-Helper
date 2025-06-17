import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: process.env.DEV_DB,
  driver: sqlite3.Database,
});

/**
 * Creates a new vacancy record in the robota_ua_pagination table.
 * Other fields will be initialized with default or NULL values.
 * @param {object} params - The parameters for the new vacancy.
 * @param {string} params.vacancy_id - The unique ID of the vacancy.
 * @param {string} params.vacancy_name - The name of the vacancy.
 * @param {string} params.vacancy_date - The date of the vacancy.
 */
export async function createVacancy({
  vacancy_id,
  vacancy_name,
  vacancy_date,
}) {
  const sql = `INSERT INTO robota_ua_pagination 
                    (vacancy_id, vacancy_name, vacancy_date)
                VALUES 
                    (?, ?, ?)`;
  await db.run(sql, vacancy_id, vacancy_name, vacancy_date);
}

/**
 * Updates the last processed page and application ID for a specific vacancy.
 * It also automatically updates the 'updated_date' to the current timestamp.
 * @param {object} params - The parameters for the update.
 * @param {string} params.vacancy_id - The ID of the vacancy to update.
 * @param {number} params.last_page - The new last page number.
 * @param {number} params.last_apply_id - The new last application ID.
 */
export async function updateVacancyProgress({
  vacancy_id,
  last_page,
  last_apply_id,
}) {
  const sql = `UPDATE 
                    robota_ua_pagination
                SET 
                    last_page = ?,
                    last_apply_id = ?,
                    updated_date = CURRENT_TIMESTAMP
                WHERE 
                    vacancy_id = ?`;
  await db.run(sql, last_page, last_apply_id, vacancy_id);
}

/**
 * Retrieves the pagination data (last page and last apply ID) for a given vacancy.
 * @param {object} params - The parameters for the query.
 * @param {string} params.vacancy_id - The ID of the vacancy to retrieve pagination for.
 * @returns {Promise<object|undefined>} An object containing last_page and last_apply_id, or undefined if not found.
 */
export async function getPagination({ vacancy_id }) {
  const sql = `SELECT 
                    last_page,
                    last_apply_id
                FROM 
                    robota_ua_pagination
                WHERE 
                    vacancy_id = ?`;
  const pagination = await db.get(sql, vacancy_id);
  return pagination;
}
export async function getAllVacancyIds() {
  const sql = `SELECT 
                    vacancy_id
                FROM 
                    robota_ua_pagination
                WHERE 
                    is_deleted = FALSE`;
  const vacancyIds = await db.all(sql);
  return vacancyIds;
}
/**
 * Marks a vacancy as deleted by setting the is_deleted flag to TRUE.
 * It also automatically updates the 'updated_date' to the current timestamp.
 * @param {object} params - The parameters for the operation.
 * @param {string} params.vacancy_id - The ID of the vacancy to mark as deleted.
 */
export async function markVacancyAsDeleted({ vacancy_id }) {
  const sql = `UPDATE 
                    robota_ua_pagination
                SET 
                    is_deleted = TRUE,
                    updated_date = CURRENT_TIMESTAMP
                WHERE 
                    vacancy_id = ?`;
  await db.run(sql, vacancy_id);
}
export async function markManyVacanciesAsDeleted({ vacancy_ids }) {
  if (!vacancy_ids || vacancy_ids.length === 0) {
    return; // No IDs to process
  }

  const placeholders = vacancy_ids.map(() => '?').join(',');

  const sql = `UPDATE 
                    robota_ua_pagination
                SET 
                    is_deleted = TRUE,
                    updated_date = CURRENT_TIMESTAMP
                WHERE 
                    vacancy_id IN (${placeholders})`;
  await db.run(sql, ...vacancy_ids);
}
export async function getAllActiveVacancies() {
  const sql = `SELECT * from robota_ua_pagination where is_deleted = FALSE`;
  const activeVacancies = await db.all(sql);
  return { activeVacancies };
}
