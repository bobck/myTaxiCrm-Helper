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
      DROP TABLE IF EXISTS remonline_orders;
      DROP TABLE IF EXISTS remonline_order_resources;
      DROP TABLE IF EXISTS remonline_campaigns;
  `;
  db.runSql(sql, callback);
};

exports.down = function (db, callback) {
  const sql = `
      CREATE TABLE remonline_orders (
          order_id INTEGER PRIMARY KEY,
          modified_at TIMESTAMP NOT NULL
      );
      CREATE TABLE remonline_order_resources (
          id INTEGER PRIMARY KEY
      );
      CREATE TABLE remonline_campaigns (
          id INTEGER PRIMARY KEY
      );
  `;
  db.runSql(sql, callback);
};

exports._meta = {
  version: 1,
};
