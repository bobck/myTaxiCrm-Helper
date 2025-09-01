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

/**
 * Removes the UNIQUE constraint from the driver_id column while preserving all data.
 * db-migrate automatically wraps this in a transaction.
 */
exports.up = function (db, callback) {
  const renameSql =
    'ALTER TABLE drivers_ignoring_cash_block_rules RENAME TO temp_drivers_ignoring_rules;';
  db.runSql(renameSql, function (err) {
    if (err) return callback(err);
    const createSql = `
      CREATE TABLE drivers_ignoring_cash_block_rules (
        driver_id STRING NOT NULL, 
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
      )
    `;
    db.runSql(createSql, function (err) {
      if (err) return callback(err);
      const copySql = `
        INSERT INTO drivers_ignoring_cash_block_rules (driver_id, is_active, created_at, updated_at)
        SELECT driver_id, is_active, created_at, updated_at FROM temp_drivers_ignoring_rules;
      `;
      db.runSql(copySql, function (err) {
        if (err) return callback(err);
        const dropSql = 'DROP TABLE temp_drivers_ignoring_rules;';
        db.runSql(dropSql, callback);
      });
    });
  });
};

/**
 * Re-adds the UNIQUE constraint to the driver_id column while preserving all data.
 * db-migrate automatically wraps this in a transaction.
 */
exports.down = function (db, callback) {
  const renameSql =
    'ALTER TABLE drivers_ignoring_cash_block_rules RENAME TO temp_drivers_ignoring_rules;';
  db.runSql(renameSql, function (err) {
    if (err) return callback(err);
    const createSql = `
      CREATE TABLE drivers_ignoring_cash_block_rules (
        driver_id STRING NOT NULL UNIQUE, 
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
      )
    `;
    db.runSql(createSql, function (err) {
      if (err) return callback(err);
      const copySql = `
        INSERT INTO drivers_ignoring_cash_block_rules (driver_id, is_active, created_at, updated_at)
        SELECT driver_id, is_active, created_at, updated_at FROM temp_drivers_ignoring_rules;
      `;
      db.runSql(copySql, function (err) {
        if (err) return callback(err);
        const dropSql = 'DROP TABLE temp_drivers_ignoring_rules;';
        db.runSql(dropSql, callback);
      });
    });
  });
};

exports._meta = {
  version: 1,
};
