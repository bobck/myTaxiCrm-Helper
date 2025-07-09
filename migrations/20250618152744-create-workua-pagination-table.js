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
  const sql = `CREATE TABLE work_ua_pagination (
    work_ua_vacancy_id INTEGER NOT NULL,
    last_apply_id INTEGER,
    bitrix_vacancy_id INTEGER,
    is_active BOOLEAN DEFAULT FALSE,
    last_apply_date DATETIME,
    region INTEGER,
    PRIMARY KEY (work_ua_vacancy_id)
    )`;
  db.runSql(sql, callback);
};

exports.down = function (db) {
  const sql = `DROP TABLE work_ua_pagination`;
  db.runSql(sql);
};

exports._meta = {
  version: 1,
};
