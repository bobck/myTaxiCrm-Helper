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
  const sql = `CREATE TABLE robota_ua_pagination (
    vacancy_id STRING NOT NULL,
    vacancy_name TEXT,
    last_page INTEGER,
    last_apply_id INTEGER,
    bitrix_id INTEGER,
    robota_ua_city_id INTEGER NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    vacancy_date DATETIME,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (vacancy_id)
    )`;
  db.runSql(sql, callback);
};

exports.down = function (db) {
  const sql = `DROP TABLE robota_ua_pagination`;
  db.runSql(sql);
};

exports._meta = {
  version: 1,
};
