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
  const sql = `
    CREATE TABLE branding_processes (
                                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                                      is_completed BOOLEAN NOT NULL DEFAULT 0,
                                      period_from TEXT NOT NULL,
                                      period_to TEXT NOT NULL,
                                      weekNumber INTEGER NOT NULL,
                                      year INTEGER NOT NULL,
                                      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.runSql(sql, callback);
};

exports.down = function (db, callback) {
  const sql = `DROP TABLE branding_processes`;
  db.runSql(sql, callback);
};

exports._meta = {
  version: 1,
};
