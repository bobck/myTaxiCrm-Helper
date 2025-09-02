'use strict';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate object in all entry points.
 * You can see which API is available by checking the documentation at:
 * https://db-migrate.readthedocs.io/en/latest/API/Security/
 */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

/**
 * The 'up' function is executed when you run the migration.
 * It adds the 'auto_park_rule_id' column to the 'driver_cash_block_rules' table
 * and updates all existing rows to set the new column's value to the max integer.
 */
exports.up = function(db, callback) {
  db.addColumn('driver_cash_block_rules', 'auto_park_rule_id', {
    type: 'int',
    notNull: false
  }, function(err) {
    if (err) {
      return callback(err);
    }
    const ID = '-1';
    const sql = `UPDATE driver_cash_block_rules SET auto_park_rule_id = ${ID}`;
    db.runSql(sql, callback);
  });
};

/**
 * The 'down' function is executed when you roll back the migration.
 * It removes the 'auto_park_rule_id' column from the 'driver_cash_block_rules' table.
 */
exports.down = function(db, callback) {
  db.removeColumn('driver_cash_block_rules', 'auto_park_rule_id', callback);
};

exports._meta = {
  "version": 1
};
