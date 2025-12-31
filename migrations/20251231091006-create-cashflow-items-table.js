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
  const sql = `
    CREATE TABLE remonline_cashflow_items (
        id INTEGER UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        direction INTEGER NOT NULL,
        is_present_in_bq BOOLEAN DEFAULT FALSE
    );
  `;
  // Using db.runSql for execution, similar to the example you provided.
  db.runSql(sql, callback);
};

exports.down = function (db, callback) {
  const sql = `
    DROP TABLE remonline_cashflow_items;
  `;
  db.runSql(sql, callback);
};
exports._meta = {
  version: 1,
};
