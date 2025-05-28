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
  const sql = `CREATE TABLE driver_cash_block_rules (
    id STRING NOT NULL,
    driver_id STRING NOT NULL, 
    is_deleted BOOLEAN DEFAULT FALSE,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`;
  db.runSql(sql, callback);
};
exports.down = function (db, callback) {
  const sql = `DROP TABLE driver_cash_block_rules`;
  db.runSql(sql, callback);
};

exports._meta = {
  version: 1,
};
