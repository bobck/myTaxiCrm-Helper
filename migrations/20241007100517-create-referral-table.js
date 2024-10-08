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
  const data = `CREATE TABLE referral (
      id INTEGER PRIMARY KEY,
      driver_id TEXT NOT NULL,
      auto_park_id TEXT NOT NULL,
      deal_id TEXT NOT NULL UNIQUE,
      contact_id TEXT NOT NULL,
      task_id TEXT NOT NULL, 
      contract TEXT NOT NULL,
      doc_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiry_after DATETIME NOT NULL,
      referral_id TEXT,
      is_approved BOOLEAN NOT NULL DEFAULT FALSE,
      assigned_by_id TEXT NOT NULL,
      city_id TEXT NOT NULL,
      referrer_phone TEXT,
      referrer_name TEXT,
      referrer_position TEXT
    )`
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports.down = function (db, callback) {
  const data = `DROP TABLE referral`
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports._meta = {
  "version": 1
};
