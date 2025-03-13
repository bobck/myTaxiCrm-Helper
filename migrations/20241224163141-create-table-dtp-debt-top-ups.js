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
  const data = `CREATE TABLE dtp_debt_transactions (
      auto_park_id TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      human_id TEXT NOT NULL,
      purpose TEXT NOT NULL,
      sum FLOAT NOT NULL,
      added_by_user_name TEXT NOT NULL, 
      dtp_deal_id TEXT NOT NULL,
      created_at DATETIME NOT NULL,
      is_valid BOOLEAN DEFAULT NULL,
      is_synchronised BOOLEAN NOT NULL DEFAULT FALSE
    )`;

  const mock =
    "INSERT INTO dtp_debt_transactions (auto_park_id,driver_id,human_id,purpose,sum,added_by_user_name,dtp_deal_id,created_at,is_valid,is_synchronised) VALUES (0,0,0,0,0,0,0,'2025-01-02 10:00:00.000 Z',true,true)";

  db.runSql(data, function (err) {
    if (err) return callback(err);

    db.runSql(mock, callback);
  });
};

exports.down = function (db, callback) {
  const data = `DROP TABLE dtp_debt_transactions`;
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports._meta = {
  version: 1,
};
