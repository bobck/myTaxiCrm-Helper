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
                                  driver_id TEXT UNIQUE NOT NULL,
                                  bitrix_card_id INTEGER UNIQUE PRIMARY KEY,
                                  total_trips TEXT,
                                  branding_process_id TEXT,
                                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                  FOREIGN KEY (branding_process_id) REFERENCES branding_processes(id) ON DELETE CASCADE
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
