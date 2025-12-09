'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};


exports.up = function (db, callback) {
  const sql = `CREATE TABLE assigned_driver_tariff_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id STRING NOT NULL,
    auto_park_id STRING NOT NULL,
    tariff_rule_id STRING NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    hired_at DATETIME NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`;
  db.runSql(sql, callback);
};
exports.down = function (db, callback) {
  const sql = `DROP TABLE assigned_driver_tariff_rules`;
  db.runSql(sql, callback);
};
exports._meta = {
  "version": 1
};
