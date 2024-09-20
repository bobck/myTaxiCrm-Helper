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
  ADD COLUMN stage_id TEXT`
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports.down = function (db, callback) {
  const data = `ALTER TABLE manifold_deals
  DROP COLUMN stage_id`
  db.runSql(data, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports._meta = {
  "version": 1
};
