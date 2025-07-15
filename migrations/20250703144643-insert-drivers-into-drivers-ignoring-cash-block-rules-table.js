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
  const driversToIgnore = [
    '21361ee9-dac3-4f70-8434-885945abaaab',
    '571cc438-a05a-44c8-a159-2e448bc27e49',
    '2bc07bdc-b04d-486c-af6a-b68a7aec2d67',
  ];

  // Construct a single INSERT statement with multiple VALUES clauses
  const values = driversToIgnore
    .map((driverId) => `('${driverId}', TRUE)`)
    .join(', ');
  const sql = `INSERT INTO drivers_ignoring_cash_block_rules (driver_id, is_active) VALUES ${values};`;

  db.runSql(sql, callback);
};

exports.down = function (db, callback) {
  const driversToIgnore = [
    '21361ee9-dac3-4f70-8434-885945abaaab',
    '571cc438-a05a-44c8-a159-2e448bc27e49',
    '2bc07bdc-b04d-486c-af6a-b68a7aec2d67',
  ];

  // Construct a single DELETE statement using an IN clause
  const driverIdsIn = driversToIgnore
    .map((driverId) => `'${driverId}'`)
    .join(', ');
  const sql = `DELETE FROM drivers_ignoring_cash_block_rules WHERE driver_id IN (${driverIdsIn});`;

  db.runSql(sql, callback);
};

exports._meta = {
  version: 2,
};
