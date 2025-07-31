import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: process.env.DEV_DB,
  driver: sqlite3.Database,
});

export const getBitrixVacancyById = async ({ bitrix_vacancy_id }) => {
  const sql = `SELECT * FROM bitrix_vacancies_to_job_board_vacancies WHERE bitrix_vacancy_id = ${bitrix_vacancy_id}`;
  return await db.get(sql);
};

export const createBitrixVacancy = async ({
  bitrix_vacancy_id,
  vacancy_name,
  work_ua_vacancy_id,
  robota_ua_vacancy_id,
  is_active,
  assigned_by_id,
}) => {
  console.log({
    bitrix_vacancy_id,
    vacancy_name,
    work_ua_vacancy_id,
    robota_ua_vacancy_id,
    is_active,
    assigned_by_id,
  });
  let columns = 'bitrix_vacancy_id,vacancy_name';
  let values = `${bitrix_vacancy_id},'${vacancy_name}'`;
  if (robota_ua_vacancy_id) {
    columns += ',robota_ua_vacancy_id';
    values += `,${robota_ua_vacancy_id}`;
  }
  if (work_ua_vacancy_id) {
    columns += ',work_ua_vacancy_id';
    values += `,${work_ua_vacancy_id}`;
  }
  if (is_active !== undefined && is_active !== null) {
    columns += ',is_active';
    values += `,${is_active}`;
  }
  if (assigned_by_id) {
    columns += ',assigned_by_id';
    values += `,${assigned_by_id}`;
  }

  const sql = `INSERT INTO bitrix_vacancies_to_job_board_vacancies (${columns}) VALUES (${values})`;
  await db.run(sql);
};
export const updateBitrixVacancy = async ({
  bitrix_vacancy_id,
  vacancy_name,
  work_ua_vacancy_id,
  robota_ua_vacancy_id,
  assigned_by_id,
}) => {
  let toSet = `vacancy_name = '${vacancy_name}'`;
  if (robota_ua_vacancy_id) {
    toSet += `,robota_ua_vacancy_id = ${robota_ua_vacancy_id}`;
  }
  if (work_ua_vacancy_id) {
    toSet += `,work_ua_vacancy_id = ${work_ua_vacancy_id}`;
  }
  if (assigned_by_id) {
    toSet += `,assigned_by_id = ${assigned_by_id}`;
  }

  const sql = /*sql*/ `UPDATE bitrix_vacancies_to_job_board_vacancies 
    SET ${toSet}
    WHERE bitrix_vacancy_id = ${bitrix_vacancy_id}`;
  console.log(sql);
  await db.run(sql);
};
export const changeBitrixVacancyActivityState = async ({
  bitrix_vacancy_id,
  is_active,
}) => {
  const sql = /*sql*/ `UPDATE bitrix_vacancies_to_job_board_vacancies 
    SET is_active = ${is_active}
    WHERE bitrix_vacancy_id = ${bitrix_vacancy_id}`;
  await db.run(sql);
};
export const markBitrixVacancyAsDeleted = async ({ bitrix_vacancy_id }) => {
  const sql = /*sql*/ `UPDATE bitrix_vacancies_to_job_board_vacancies 
    SET is_deleted = TRUE
    WHERE bitrix_vacancy_id = ${bitrix_vacancy_id}`;
  await db.run(sql);
};
