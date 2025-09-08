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
  const sql = `CREATE TABLE auto_parks_excluded_from_cash_block_rules (
    auto_park_id STRING NOT NULL, 
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
  db.runSql(sql, callback);
};
exports.down = function (db, callback) {
  const sql = `DROP TABLE auto_parks_excluded_from_cash_block_rules`;
  db.runSql(sql, callback);
};
exports._meta = {
  version: 1,
};
