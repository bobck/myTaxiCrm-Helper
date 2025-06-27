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

/**
 * Inserts a new vacancy apply record into the robota_ua_vacancy_applies table.
 * 'created_date' and 'updated_date' will be initialized with the current timestamp.
 * 'is_deleted' defaults to FALSE.
 * @param {object} params - The parameters for the new vacancy apply.
 * @param {number} [params.id] - Optional ID for the record. If not provided, SQLite will auto-increment.
 * @param {string} params.vacancy_id - The ID of the vacancy.
 * @param {number} [params.bitrix_id] - Optional Bitrix ID associated with the apply.
 * @param {number} [params.robota_ua_city_id] - Optional city ID from robota.ua.
 * @param {string} [params.apply_date] - Optional date of the application (DATETIME format).
 */
export async function createVacancyApply({
  id = null, // Allow optional ID
  vacancy_id,
  bitrix_id = null,
  robota_ua_city_id = null,
  apply_date = null,
}) {
  const sql = `INSERT INTO robota_ua_vacancy_applies 
                    (id, vacancy_id, bitrix_id, robota_ua_city_id, apply_date)
                VALUES 
                    (?, ?, ?, ?, ?)`;
  await db.run(sql, id, vacancy_id, bitrix_id, robota_ua_city_id, apply_date);
}

/**
 * Inserts multiple new vacancy apply records into the robota_ua_vacancy_applies table in a batch.
 * This operation is wrapped in a transaction for atomicity and performance.
 * 'created_date' and 'updated_date' for each record will be initialized with the current timestamp.
 * 'is_deleted' defaults to FALSE for each record.
 * @param {Array<object>} applies - An array of objects, where each object represents a vacancy apply.
 * Each object should have at least 'vacancy_id' and can optionally include 'id',
 * 'bitrix_id', 'robota_ua_city_id', and 'apply_date'.
 * If 'id' is not provided for an individual apply, SQLite will auto-increment it.
 * Example: [{ id: 1, vacancy_id: 'v1' }, { vacancy_id: 'v2', bitrix_id: 123 }]
 */
export async function createManyVacancyApplies({ applies }) {
  if (!applies || applies.length === 0) {
    console.log('No vacancy apply records to insert.');
    return;
  }

  // Define the columns for insertion
  const columns = `(id, vacancy_id, bitrix_id, robota_ua_city_id, apply_date)`;

  // Create placeholders for each row
  const placeholders = applies.map(() => `(?, ?, ?, ?, ?)`).join(', ');

  // Flatten all values into a single array for the batch insert
  const values = [];
  applies.forEach((apply) => {
    values.push(
      apply.id || null, // Allow user-provided ID, or null for auto-increment
      apply.vacancy_id,
      apply.bitrix_id || null,
      apply.robota_ua_city_id || null,
      apply.apply_date || null
    );
  });

  const sql = `INSERT INTO robota_ua_vacancy_applies 
                    ${columns}
                VALUES 
                    ${placeholders}`;

  // Execute the batch insert within a transaction
  await db
    .transaction(async () => {
      await db.run(sql, ...values);
    })
    .catch((error) => {
      console.error('Error during batch insertion of vacancy applies:', error);
      // Re-throw or handle the error as appropriate for your application
      throw error;
    });
}

/**
 * Updates an existing vacancy apply record based on its ID.
 * It automatically updates the 'updated_date' to the current timestamp.
 * @param {object} params - The parameters for the update.
 * @param {number} params.id - The primary key ID of the vacancy apply to update.
 * @param {string} [params.vacancy_id] - Optional new vacancy ID.
 * @param {number} [params.bitrix_id] - Optional new Bitrix ID.
 * @param {number} [params.robota_ua_city_id] - Optional new city ID.
 * @param {boolean} [params.is_deleted] - Optional new deletion status.
 * @param {string} [params.apply_date] - Optional new application date (DATETIME format).
 */
export async function updateVacancyApply({
  id,
  vacancy_id,
  bitrix_id,
  robota_ua_city_id,
  is_deleted,
  apply_date,
}) {
  const fields = [];
  const values = [];

  if (vacancy_id !== undefined) {
    fields.push('vacancy_id = ?');
    values.push(vacancy_id);
  }
  if (bitrix_id !== undefined) {
    fields.push('bitrix_id = ?');
    values.push(bitrix_id);
  }
  if (robota_ua_city_id !== undefined) {
    fields.push('robota_ua_city_id = ?');
    values.push(robota_ua_city_id);
  }
  if (is_deleted !== undefined) {
    fields.push('is_deleted = ?');
    values.push(is_deleted);
  }
  if (apply_date !== undefined) {
    fields.push('apply_date = ?');
    values.push(apply_date);
  }

  if (fields.length === 0) {
    console.log('No fields to update for vacancy apply.');
    return;
  }

  const sql = `UPDATE robota_ua_vacancy_applies
                SET ${fields.join(', ')}, updated_date = CURRENT_TIMESTAMP
                WHERE id = ?`;
  await db.run(sql, ...values, id);
}

/**
 * Retrieves a single vacancy apply record by its ID.
 * @param {object} params - The parameters for the query.
 * @param {number} params.id - The ID of the vacancy apply to retrieve.
 * @returns {Promise<object|undefined>} An object containing the vacancy apply data, or undefined if not found.
 */
export async function getVacancyApplyById({ id }) {
  const sql = `SELECT *
                FROM robota_ua_vacancy_applies
                WHERE id = ?`;
  const apply = await db.get(sql, id);
  return apply;
}

/**
 * Retrieves all vacancy apply records for a given vacancy ID.
 * @param {object} params - The parameters for the query.
 * @param {string} params.vacancy_id - The vacancy ID to filter by.
 * @param {boolean} [params.include_deleted=false] - If true, includes records marked as deleted.
 * @returns {Promise<Array<object>>} An array of vacancy apply records.
 */
export async function getVacancyAppliesByVacancyId({
  vacancy_id,
  include_deleted = false,
}) {
  let sql = `SELECT *
                FROM robota_ua_vacancy_applies
                WHERE vacancy_id = ?`;
  const values = [vacancy_id];

  if (!include_deleted) {
    sql += ` AND is_deleted = FALSE`;
  }

  const applies = await db.all(sql, ...values);
  return applies;
}

/**
 * Marks a specific vacancy apply record as deleted by setting the is_deleted flag to TRUE.
 * It also automatically updates the 'updated_date' to the current timestamp.
 * @param {object} params - The parameters for the operation.
 * @param {number} params.id - The ID of the vacancy apply to mark as deleted.
 */
export async function markVacancyApplyAsDeleted({ id }) {
  const sql = `UPDATE robota_ua_vacancy_applies
                SET is_deleted = TRUE, updated_date = CURRENT_TIMESTAMP
                WHERE id = ?`;
  await db.run(sql, id);
}

/**
 * Retrieves all non-deleted vacancy applies.
 * @returns {Promise<Array<object>>} An array of active vacancy apply records.
 */
export async function getAllActiveVacancyApplies() {
  const sql = `SELECT * FROM robota_ua_vacancy_applies WHERE is_deleted = FALSE`;
  const activeApplies = await db.all(sql);
  return activeApplies;
}

/**
 * Deletes a vacancy apply record by its ID.
 * Use with caution, as this permanently removes the record.
 * @param {object} params - The parameters for the operation.
 * @param {number} params.id - The ID of the vacancy apply to delete.
 */
export async function deleteVacancyApplyById({ id }) {
  const sql = `DELETE FROM robota_ua_vacancy_applies WHERE id = ?`;
  await db.run(sql, id);
}
export const getAllUniqueRobotaUaCityIds = async () => {
  const sql = `SELECT DISTINCT robota_ua_city_id FROM robota_ua_pagination;`;
  return await db.all(sql);
};
