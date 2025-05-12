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
  const sql = /*sql*/ `
      CREATE TABLE api_auth_tokens (
          token TEXT NOT NULL PRIMARY KEY,
          owner_description TEXT NOT NULL,
          rule_set TEXT NOT NULL DEFAULT 'basic',
          is_banned BOOLEAN NOT NULL DEFAULT FALSE
      );
  `;
  db.runSql(sql, callback);
};
exports.down = function(db) {
  const sql = /*sql*/ `DROP TABLE api_auth_tokens;`;
  db.runSql(sql, callback);
};

exports._meta = {
  "version": 1
};
