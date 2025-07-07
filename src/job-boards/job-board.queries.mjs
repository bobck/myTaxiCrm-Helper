import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: process.env.DEV_DB,
  driver: sqlite3.Database,
});

export const getVacancyById = async ({ bitrix_vacancy_id }) => {
  const sql = `SELECT * FROM bitrix_vacancies_to_job_board_vacancies WHERE bitrix_vacancy_id = ${bitrix_vacancy_id}`;
  return await db.get(sql);
};

export const createBitrixVacancy = async ({
  bitrix_vacancy_id,
  vacancy_name,
  work_ua_vacancy_id,
  robota_ua_vacancy_id,
}) => {
  const sql = `INSERT INTO bitrix_vacancies_to_job_board_vacancies 
    (bitrix_vacancy_id,vacancy_name,work_ua_vacancy_id,robota_ua_vacancy_id) 
    VALUES (${bitrix_vacancy_id},'${vacancy_name}',${work_ua_vacancy_id},${robota_ua_vacancy_id})`;
  await db.run(sql);
};
