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
    CREATE TABLE branding_cards_new (
        driver_id TEXT NOT NULL,  -- Removed UNIQUE constraint
        bitrix_card_id INTEGER UNIQUE PRIMARY KEY,
        total_trips TEXT,
        branding_process_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (branding_process_id) REFERENCES branding_processes(id) ON DELETE CASCADE
    );

    -- Copy data from old table to new table
    INSERT INTO branding_cards_new (driver_id, bitrix_card_id, total_trips, branding_process_id, created_at, updated_at)
    SELECT driver_id, bitrix_card_id, total_trips, branding_process_id, created_at, updated_at FROM branding_cards;

    -- Drop the old table
    DROP TABLE branding_cards;

    -- Rename the new table to the original name
    ALTER TABLE branding_cards_new RENAME TO branding_cards;
  `;
  db.runSql(sql, callback);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  version: 1,
};
