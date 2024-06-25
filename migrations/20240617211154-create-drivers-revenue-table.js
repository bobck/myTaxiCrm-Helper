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
  const data = `CREATE TABLE drivers_revenue (
    company_id TEXT NOT NULL,
    auto_park_id TEXT NOT NULL,
    driver_id TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    auto_park_revenue FLOAT NOT NULL,
    rides_count INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    contacts_array TEXT,
    contacts_add_at DATETIME,
    deal_id TEXT,
    deat_add_at DATETIME,
    sync_at DATETIME
    )`
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports.down = function (db, callback) {
  const data = `DROP TABLE drivers_revenue`
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports._meta = {
  "version": 1
};
