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
  const clear = `DELETE FROM manifold_deals WHERE ID IS NOT NULL`
  db.runSql(clear, function (err) {
    if (err) return console.log(err);
    // callback();
  });

  const data = `ALTER TABLE manifold_deals 
  ADD COLUMN city_name TEXT NOT NULL;
  ALTER TABLE manifold_deals 
  ADD COLUMN assigned_by_id INTEGER NOT NULL;
  ALTER TABLE manifold_deals
  ADD COLUMN title TEXT NOT NULL`
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports.down = function (db, callback) {
  const data = `ALTER TABLE manifold_deals
  DROP COLUMN city_name;
  ALTER TABLE manifold_deals
  DROP COLUMN assigned_by_id;
  ALTER TABLE manifold_deals
  DROP COLUMN title`
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports._meta = {
  "version": 1
};