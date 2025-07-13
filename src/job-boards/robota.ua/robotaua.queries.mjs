import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: process.env.DEV_DB,
  driver: sqlite3.Database,
});

export async function updateVacancyProgress({
  robota_ua_vacancy_id,
  last_apply_date,
}) {
  console.log(arguments);
  const sql = /*sql*/ `UPDATE 
                    robota_ua_pagination
                SET 
                    last_apply_date = ?
                WHERE 
                    robota_ua_vacancy_id = ?`;
  await db.run(sql, last_apply_date, robota_ua_vacancy_id);
}

export async function markRobotaUaVacancyAsActive({ robota_ua_vacancy_id }) {
  const sql = /*sql*/ `UPDATE 
                    robota_ua_pagination
                SET 
                    is_active = TRUE
                WHERE 
                    robota_ua_vacancy_id = ?`;
  await db.run(sql, robota_ua_vacancy_id);
}
export async function markRobotaUaVacancyAsInactive({ robota_ua_vacancy_id }) {
  const sql = /*sql*/ `UPDATE 
                    robota_ua_pagination
                SET 
                    is_active = FALSE
                WHERE 
                    robota_ua_vacancy_id = ?`;
  await db.run(sql, robota_ua_vacancy_id);
}
export async function getAnyRobotaUaVacancyById({ robota_ua_vacancy_id }) {
  const sql = /*sql*/ `SELECT * from robota_ua_pagination where robota_ua_vacancy_id = ?`;
  return await db.get(sql, robota_ua_vacancy_id);
}
export async function getAnyRobotaUaVacancyByBitrixId({ bitrix_vacancy_id }) {
  const sql = /*sql*/ `SELECT * from robota_ua_pagination where bitrix_vacancy_id = ?`;
  return await db.get(sql, bitrix_vacancy_id);
}
export const createRobotaUaSynchronizedVacancy = async ({
  bitrix_vacancy_id,
  robotaUaVacancy,
  is_active,
}) => {
  const {
    vacancyId: robota_ua_vacancy_id,
    cityId: region,
    state,
    vacancyName: name,
  } = robotaUaVacancy;
  const IS_ACTIVE = state == 'Publicated';
  const sql = /*sql*/ `INSERT INTO robota_ua_pagination (bitrix_vacancy_id,robota_ua_vacancy_id,is_active,region, name) VALUES (?,?,?,?,?)`;
  await db.run(
    sql,
    bitrix_vacancy_id,
    robota_ua_vacancy_id,
    is_active,
    region,
    name
  );
};
export const updateRobotaUaSynchronizedVacancy = async ({
  bitrix_vacancy_id,
  robota_ua_vacancy_id,
  is_active,
}) => {
  const sql = /*sql*/ `UPDATE robota_ua_pagination SET robota_ua_vacancy_id = ?, is_active = ? WHERE bitrix_vacancy_id = ?`;

  await db.run(sql, robota_ua_vacancy_id, is_active, bitrix_vacancy_id);
};
export const getAllActiveRobotaUaVacancies = async () => {
  const sql = /*sql*/ `SELECT rp.*
              from robota_ua_pagination rp join bitrix_vacancies_to_job_board_vacancies bc on rp.bitrix_vacancy_id = bc.bitrix_vacancy_id
              where rp.is_active = TRUE and bc.is_active = TRUE`;
  const activeVacancies = await db.all(sql);
  return { activeVacancies };
};
