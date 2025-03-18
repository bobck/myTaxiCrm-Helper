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
    CREATE TABLE fired_debtor_drivers (
                                      bitrix_card_id INTEGER PRIMARY KEY UNIQUE NOT NULL,
                                      full_name TEXT NOT NULL,
                                      auto_park_id TEXT NOT NULL,
                                      cs_current_week INTEGER NOT NULL,
                                      cs_current_year INTEGER NOT NULL,
                                      current_week_balance TEXT NOT NULL,
                                      current_week_total_deposit TEXT NOT NULL,
                                      current_week_total_debt TEXT NOT NULL,
                                      fire_date TEXT,
                                      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.runSql(sql, callback);
};

exports.down = function (db, callback) {
  const sql = `DROP TABLE fired_debtor_drivers`;
  db.runSql(sql, callback);
};

exports._meta = {
  version: 1,
};
