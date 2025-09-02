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

/**
 * Inserts a row with the maximum possible ID into the auto_park_custom_cash_block_rules table.
 * WARNING: After running this migration, you will NOT be able to insert any new rows into this table
 * because the AUTOINCREMENT sequence will be exhausted.
 */
exports.up = function (db, callback) {
  // The maximum value for a 64-bit signed integer in SQLite.
  const ID = '-1';
  const sql = `INSERT INTO auto_park_custom_cash_block_rules (
    rule_id, 
    auto_park_id, 
    mode, 
    target, 
    maxDebt,
    balanceActivationValue,
    is_active
  ) VALUES (
    ${ID}, 
    'DEFAULT', 
    'MIN_DEBT', 
    'BALANCE', 
    -1000,
    200,
    false
  )`;
  db.runSql(sql, callback);
};

/**
 * Removes the row with the maximum possible ID.
 */
exports.down = function (db, callback) {
  const ID = '-1';
  const sql = `DELETE FROM auto_park_custom_cash_block_rules WHERE rule_id = ${ID}`;
  db.runSql(sql, callback);
};

exports._meta = {
  version: 1,
};
