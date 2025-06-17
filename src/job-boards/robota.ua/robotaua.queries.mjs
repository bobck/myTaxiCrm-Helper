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
  vacancy_date
}) {
  const sql = `INSERT INTO robota_ua_pagination 
                    (vacancy_id, vacancy_name, vacancy_date)
                VALUES 
                    (?, ?, ?)`;
  await db.run(
    sql,
    vacancy_id,
    vacancy_name,
    vacancy_date
  );
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
export async function getPagination({
  vacancy_id
}) {
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
