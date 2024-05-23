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
  const data = `CREATE TABLE last_fired_driver (
    category_id TEXT NOT NULL,
    unix_created_at INTEGER NOT NULL
    )`
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });

  //INSERT INTO last_fired_driver(category_id, unix_created_at) VALUES(54,1714396893389)
};


exports.down = function (db, callback) {
  const data = `DROP TABLE last_fired_driver`
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports._meta = {
  "version": 1
};
