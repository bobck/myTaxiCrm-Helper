'use strict';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.up = function (db, callback) {
  const data = `CREATE TABLE manifold_deals (
    id TEXT UNIQUE NOT NULL,
    accident_id TEXT,
    aviable_for_office_only BOOLEAN DEFAULT FALSE,
    contact_id TEXT,
    contact_phone TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    contacts_add_at DATETIME
    )`;
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports.down = function (db, callback) {
  const data = `DROP TABLE manifold_deals`;
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports._meta = {
  version: 1,
};
