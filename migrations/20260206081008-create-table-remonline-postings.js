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
  const sql = `
    CREATE TABLE remonline_postings (
      posting_id INTEGER PRIMARY KEY,
      created_at INTEGER NOT NULL,
      is_product_cells_scrapped BOOLEAN NOT NULL DEFAULT FALSE
    )
  `;
  db.runSql(sql, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports.down = function (db, callback) {
  const sql = `DROP TABLE remonline_postings`;
  db.runSql(sql, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports._meta = {
  version: 1,
};
