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
  const addColumn = `ALTER TABLE referral 
                        ADD COLUMN procent_reward_expiry_after DATETIME  NOT NULL DEFAULT  '2024-01-01 00:00:00';`;

  const updateColumn = `UPDATE referral SET procent_reward_expiry_after = DATETIME(created_at, '+35 days');`;

  db.runSql(addColumn, function (err) {
    if (err) return callback(err);

    db.runSql(updateColumn, callback);
  });
};

exports.down = function (db, callback) {
  const data = `ALTER TABLE referral
  DROP COLUMN procent_reward_expiry_after`;
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports._meta = {
  version: 1,
};
