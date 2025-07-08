import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { robotaUaAPI } from './robotaua.utils.mjs';

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
  robota_ua_city_id,
}) {
  //robota_ua_city_id
  // console.log(arguments)
  const sql = `INSERT INTO robota_ua_pagination 
                    (vacancy_id, vacancy_name, vacancy_date, robota_ua_city_id)
                VALUES 
                    (?, ?, ?,?)`;
  await db.run(sql, vacancy_id, vacancy_name, vacancy_date, robota_ua_city_id);
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
                    is_active = FALSE`;
  const vacancyIds = await db.all(sql);
  return vacancyIds;
}
/**
 * Marks a vacancy as active by setting the is_active flag to TRUE.
 * It also automatically updates the 'updated_date' to the current timestamp.
 * @param {object} params - The parameters for the operation.
 * @param {string} params.vacancy_id - The ID of the vacancy to mark as active.
 */
export async function markRobotaUaVacancyAsActive({ robota_ua_vacancy_id }) {
  const sql = `UPDATE 
                    robota_ua_pagination
                SET 
                    is_active = TRUE
                WHERE 
                    robota_ua_vacancy_id = ?`;
  await db.run(sql, robota_ua_vacancy_id);
}
export async function markManyRobotaUaVacanciesAsActive({ vacancy_ids }) {
  if (!vacancy_ids || vacancy_ids.length === 0) {
    return; // No IDs to process
  }

  const placeholders = vacancy_ids.map(() => '?').join(',');

  const sql = `UPDATE 
                    robota_ua_pagination
                SET 
                    is_active = TRUE,
                    updated_date = CURRENT_TIMESTAMP
                WHERE 
                    vacancy_id IN (${placeholders})`;
  await db.run(sql, ...vacancy_ids);
}
export async function getAllActiveRobotaUaVacancies() {
  const sql = `SELECT * from robota_ua_pagination where is_active = FALSE`;
  const activeVacancies = await db.all(sql);
  return { activeVacancies };
}
export const createRobotaUaSynchronizedVacancy = async ({
  bitrix_vacancy_id,
  robota_ua_vacancy_id,
  is_active,
}) => {
  const sql = `INSERT INTO robota_ua_pagination (bitrix_vacancy_id,robota_ua_vacancy_id,is_active) VALUES (?,?,?)`;

  await db.run(sql, bitrix_vacancy_id, robota_ua_vacancy_id, is_active);
};