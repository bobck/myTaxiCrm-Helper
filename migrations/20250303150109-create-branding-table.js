'use strict';

var dbm;
var type;
var seed;

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, callback) {
  const sql = `
    CREATE TABLE branding_cards (
                                  driver_id TEXT PRIMARY KEY,
                                  crm_card_id INTEGER,
                                  total_trips TEXT,
                                  weekNumber INTEGER,
                                  year INTEGER,
                                  period_from DATETIME,
                                  period_to DATETIME,
                                  created_at DATETIME,
                                  updated_at DATETIME
    )
  `;
  db.runSql(sql, callback);
};

exports.down = function(db, callback) {
  const sql = `DROP TABLE branding_cards`;
  db.runSql(sql, callback);
};

exports._meta = {
  "version": 1
};
