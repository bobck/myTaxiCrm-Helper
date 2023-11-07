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
  const data = `CREATE TABLE sids (
    id TEXT,
    auto_park_id TEXT,
    created_at DATETIME,
    purpose TEXT,
    comment TEXT,
    sid_lable TEXT,
    is_parsed BOOLEAN DEFAULT false,
    sid_id INTEGER,
    status_id INTEGER,
    is_closed BOOLEAN
    )`

  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback()
  });
};

exports.down = function (db, callback) {
  const data = `DROP TABLE sids`
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback()
  });
};

exports._meta = {
  "version": 1
};
