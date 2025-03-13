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
  const data = `CREATE TABLE cashless_payments_applications (
    id TEXT NOT NULL UNIQUE,
    auto_park_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT WAITING_CONFIRMATION,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    remonline_transaction_id TEXT NOT NULL UNIQUE
    )`;
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports.down = function (db, callback) {
  const data = `DROP TABLE cashless_payments_applications`;
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports._meta = {
  version: 1,
};
