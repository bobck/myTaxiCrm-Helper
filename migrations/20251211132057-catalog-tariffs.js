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
    CREATE TABLE catalog_tariffs (
        id VARCHAR(255) NOT NULL,
        auto_park_id VARCHAR(255) NOT NULL,
        "weekDay" INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  // Using db.runSql for execution, similar to the example you provided.
  db.runSql(sql, callback);
};

exports.down = function (db, callback) {
  const sql = `
    DROP TABLE catalog_tariffs;
  `;
  db.runSql(sql, callback);
};
exports._meta = {
  version: 1,
};
