'use strict';

var dbm;
var type;
var seed;

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  const sql = `ALTER TABLE driver_cash_block_rules ADD COLUMN driver_cash_block_rule_id TEXT;`;
  db.runSql(sql, callback);
};

exports.down = function (db, callback) {
  const sql = `ALTER TABLE driver_cash_block_rules DROP COLUMN driver_cash_block_rule_id;`;
  db.runSql(sql, callback);
};

exports._meta = {
  version: 1,
};
