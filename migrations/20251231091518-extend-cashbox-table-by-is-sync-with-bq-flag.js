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
  const data = `
    ALTER TABLE remonline_cashboxes 
    ADD COLUMN is_present_in_bq BOOLEAN DEFAULT FALSE;
  `;

  db.runSql(data, function (err) {
    if (err) {
      console.error('Migration UP failed (ALTER TABLE ADD COLUMN):', err);
      return callback(err);
    }
    callback();
  });
};

/**
 * Executes the DOWN migration: Removes the auto_park_id column.
 */
exports.down = function (db, callback) {
  const data = `
    ALTER TABLE remonline_cashboxes 
    DROP COLUMN is_present_in_bq;
  `;

  db.runSql(data, function (err) {
    if (err) {
      console.error('Migration DOWN failed (ALTER TABLE DROP COLUMN):', err);
      return callback(err);
    }
    callback();
  });
};

exports._meta = {
  version: 1,
};
