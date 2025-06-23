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
  const sql = `CREATE TABLE robota_ua_vacancy_applies (
    id INTEGER PRIMARY KEY,
    vacancy_id STRING NOT NULL,
    bitrix_id INTEGER,
    robota_ua_city_id INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE,
    apply_date DATETIME,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`;
  db.runSql(sql, callback);
};

exports.down = function (db) {
  const sql = `DROP TABLE robota_ua_vacancy_applies`;
  db.runSql(sql);
};

exports._meta = {
  version: 1,
};
