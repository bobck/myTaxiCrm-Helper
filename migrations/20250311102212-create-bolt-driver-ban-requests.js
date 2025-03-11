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
  const createTable = `
    CREATE TABLE IF NOT EXISTS bolt_driver_ban_requests (
      debt REAL,
      bitrix_card_id INTEGER PRIMARY KEY,
      driver_id TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.runSql(createTable, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports.down = function (db, callback) {
  const dropTable = `DROP TABLE IF EXISTS bolt_driver_ban_requests;`;

  db.runSql(dropTable, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports._meta = {
  "version": 1
};
