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
 * Creates the auto_park_custom_cash_block_rules table.
 * This table stores custom rules for auto-parking cash block logic.
 */
exports.up = function (db, callback) {
  const sql = `CREATE TABLE auto_park_custom_cash_block_rules (
    rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    auto_park_id TEXT NOT NULL,
    mode TEXT NOT NULL,
    target TEXT NOT NULL,
    balanceActivationValue INTEGER,
    depositActivationValue INTEGER,
    maxDebt INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
    )`;
  db.runSql(sql, callback);
};

/**
 * Drops the auto_park_custom_cash_block_rules table.
 */
exports.down = function (db, callback) {
  const sql = `DROP TABLE auto_park_custom_cash_block_rules`;
  db.runSql(sql, callback);
};

exports._meta = {
  version: 1,
};
