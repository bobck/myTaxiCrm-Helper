import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: process.env.DEV_DB, // Убедитесь, что это правильный путь к вашей базе данных Work.ua
  driver: sqlite3.Database,
});

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

export async function updateWorkUaVacancyProgress({
  work_ua_vacancy_id,
  last_apply_id,
  last_apply_date,
}) {
  const sql = `UPDATE
                    work_ua_pagination
                SET
                    last_apply_id = ?,
                    last_apply_date = ?
                WHERE
                    work_ua_vacancy_id = ?`;
  await db.run(sql, last_apply_id, last_apply_date, work_ua_vacancy_id);
}

export async function getWorkUaPagination({ vacancy_id }) {
  const sql = `SELECT
                    last_apply_id,
                    last_apply_date
                FROM
                    work_ua_pagination
                WHERE
                    vacancy_id = ?`;
  const pagination = await db.get(sql, vacancy_id);
  return pagination;
}

export async function getAnyWorkUaVacancyById({ work_ua_vacancy_id }) {
  const sql = `SELECT
                    *
                FROM
                    work_ua_pagination
                WHERE
                    work_ua_vacancy_id = ?`;
  return await db.get(sql, work_ua_vacancy_id);
}
export async function getAnyWorkUaVacancyByBitrixId({ bitrix_vacancy_id }) {
  const sql = `SELECT
                    *
                FROM
                    work_ua_pagination
                WHERE
                    bitrix_vacancy_id = ?`;
  return await db.get(sql, bitrix_vacancy_id);
}
/**
 * Marks a Work.ua vacancy as active by setting the is_active flag to TRUE.
 * It also automatically updates the 'updated_date' to the current timestamp.
 * @param {object} params - The parameters for the operation.
 * @param {string} params.work_ua_vacancy_id - The ID of the vacancy to mark as .
 */
export async function updateWorkUaVacancyActivityState({ work_ua_vacancy_id }) {
  const sql = /*sql*/ `UPDATE
                    work_ua_pagination
                SET
                    is_active = TRUE
                WHERE
                    work_ua_vacancy_id = ?`;
  await db.run(sql, work_ua_vacancy_id);
}
export const updateWorkUaVacancyPublicationType = async ({
  work_ua_vacancy_id,
  publicationType,
}) => {
  const sql = /*sql*/ `UPDATE
                    work_ua_pagination
                SET
                    publicationType = ?
                WHERE
                    work_ua_vacancy_id = ?`;
  await db.run(sql, publicationType, work_ua_vacancy_id);
};
export async function getAllActiveWorkUaVacancies() {
  const sql = `SELECT wp.name, wp.work_ua_vacancy_id, wp.last_apply_id, wp.last_apply_date, wp.region, wp.bitrix_vacancy_id 
              from work_ua_pagination wp join bitrix_vacancies_to_job_board_vacancies bc on wp.bitrix_vacancy_id = bc.bitrix_vacancy_id
              where wp.is_active = TRUE and bc.is_active = TRUE`;
  const activeVacancies = await db.all(sql);
  return { activeVacancies };
}
export const createWorkUaSynchronizedVacancy = async ({
  bitrix_vacancy_id,
  workUaVacancy,
  work_ua_publication_type,
}) => {
  const {
    id: work_ua_vacancy_id,
    region,
    publication: publicationType,
    experience,
    jobtype,
    category,
    description,
    name,
    active,
  } = workUaVacancy;
  const is_active = Boolean(active);
  const jobTypeStringified = JSON.stringify(jobtype);
  const categoryStringified = JSON.stringify(category);

  const sql = `INSERT INTO work_ua_pagination (bitrix_vacancy_id,work_ua_vacancy_id,is_active,region,publicationType,experience,jobtype,category,description,name) VALUES (?,?,?,?,?,?,?,?,?,?)`;

  await db.run(
    sql,
    bitrix_vacancy_id,
    work_ua_vacancy_id,
    is_active,
    region,
    work_ua_publication_type || publicationType,
    experience,
    jobTypeStringified,
    categoryStringified,
    description,
    name
  );
};
export const updateWorkUaSynchronizedVacancy = async ({
  bitrix_vacancy_id,
  workUaVacancy,
  work_ua_publication_type,
}) => {
  const {
    id: work_ua_vacancy_id,
    region,
    publication: publicationType,
    experience,
    jobtype,
    category,
    description,
    name,
    active,
  } = workUaVacancy;
  const is_active = Boolean(active);
  const jobTypeStringified = JSON.stringify(jobtype);
  const categoryStringified = JSON.stringify(category);
  const sql = /*sql */ `UPDATE work_ua_pagination SET work_ua_vacancy_id = ?, is_active = ?,region=?,publicationType=?,experience=?,jobtype=?,category=?,description=?,name=? WHERE bitrix_vacancy_id = ?`;

  await db.run(
    sql,
    work_ua_vacancy_id,
    is_active,
    region,
    work_ua_publication_type || publicationType,
    experience,
    jobTypeStringified,
    categoryStringified,
    description,
    name,
    bitrix_vacancy_id
  );
};
export const deleteWorkUaSynchronizedVacancy = async ({
  bitrix_vacancy_id,
}) => {
  const sql = `DELETE FROM work_ua_pagination WHERE bitrix_vacancy_id = ?`;
  await db.run(sql, bitrix_vacancy_id);
};
