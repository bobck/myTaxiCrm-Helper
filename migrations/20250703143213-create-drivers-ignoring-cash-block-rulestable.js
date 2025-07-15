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
  const sql = `CREATE TABLE drivers_ignoring_cash_block_rules (
    driver_id STRING NOT NULL UNIQUE, 
    is_active BOOLEAN DEFAULT TRUE
    )`;
  db.runSql(sql, callback);
};
exports.down = function (db, callback) {
  const sql = `DROP TABLE drivers_ignoring_cash_block_rules`;
  db.runSql(sql, callback);
};
exports._meta = {
  version: 1,
};
