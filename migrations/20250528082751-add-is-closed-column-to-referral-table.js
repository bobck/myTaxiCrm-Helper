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

exports.up = function (db, cb) {
  const sql = `ALTER TABLE referral ADD COLUMN is_closed BOOLEAN NOT NULL DEFAULT FALSE`;
  db.runSql(sql, cb);
};

exports.down = function (db, cb) {
  const sql = `ALTER TABLE referral DROP COLUMN is_closed`;
  db.runSql(sql, cb);
};

exports._meta = {
  version: 1,
};
