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
  const sql = /*sql*/ `
      CREATE TABLE bolt_drivers_to_ban (
          driver_id TEXT PRIMARY KEY,
          bolt_id TEXT NOT NULL,
          bitrix_deal_id INTEGER NOT NULL,
          phone TEXT NOT NULL,
          is_banned BOOLEAN NOT NULL DEFAULT FALSE,
          is_first_letter_sent BOOLEAN NOT NULL DEFAULT FALSE,
          is_second_letter_sent BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
  `;
  db.runSql(sql, callback);
};

exports.down = function (db, callback) {
  const sql = /*sql*/ `DROP TABLE bolt_drivers_to_ban;`;
  db.runSql(sql, callback);
};

exports._meta = {
  version: 1,
};
