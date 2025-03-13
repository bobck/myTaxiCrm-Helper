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
  const data = `CREATE TABLE remonline_cashboxes (
    id TEXT UNIQUE NOT NULL,
    last_transaction_created_at TIMESTAMP,
    auto_park_id TEXT NOT NULL,
    auto_park_cashbox_id TEXT NOT NULL,
    default_contator_id TEXT NOT NULL,
    usa_contator_id TEXT,
    scooter_contator_id TEXT,
    is_enabled BOOLEAN DEFAULT TRUE
    )`;
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports.down = function (db, callback) {
  const data = `DROP TABLE remonline_cashboxes`;
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports._meta = {
  version: 1,
};
