'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};


exports.up = function (db, callback) {
  const data = `ALTER TABLE drivers_custom_bonus_rules_ids 
  ADD COLUMN is_not_found BOOLEAN DEFAULT FALSE`
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports.down = function (db, callback) {
  const data = `ALTER TABLE drivers_custom_bonus_rules_ids
  DROP COLUMN is_not_found`
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports._meta = {
  "version": 1
};
