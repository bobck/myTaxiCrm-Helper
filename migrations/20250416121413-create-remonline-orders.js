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
      CREATE TABLE "remonline-orders" (
          order_id INTEGER PRIMARY KEY,
          page INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
  `;
  db.runSql(sql, callback);
};

exports.down = function (db, callback) {
  const sql = `
      DROP TABLE "remonline-orders";
  `;
  db.runSql(sql, callback);
};

exports._meta = {
  version: 1,
};
