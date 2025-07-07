'use strict';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  const sql = /*sql*/ `CREATE TABLE bitrix_vacancies_to_job_board_vacancies (
    vacancy_name TEXT,
    bitrix_vacancy_id INTEGER,
    work_ua_vacancy_id INTEGER,
    robota_ua_vacancy_id INTEGER,
    is_active BOOLEAN DEFAULT FALSE,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (bitrix_vacancy_id)
    )`;
  db.runSql(sql, callback);
};

exports.down = function (db) {
  const sql = `DROP TABLE bitrix_vacancies_to_job_board_vacancies`;
  db.runSql(sql);
};

exports._meta = {
  version: 1,
};
