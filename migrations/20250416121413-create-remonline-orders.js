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
  const sql = `
      CREATE TABLE remonline_orders (
          order_id INTEGER PRIMARY KEY,
          modified_at TIMESTAMP NOT NULL
      );
  `;
  db.runSql(sql, callback);
};

exports.down = function (db, callback) {
  const sql = `
      DROP TABLE remonline_orders;
  `;
  db.runSql(sql, callback);
};

exports._meta = {
  version: 1,
};
