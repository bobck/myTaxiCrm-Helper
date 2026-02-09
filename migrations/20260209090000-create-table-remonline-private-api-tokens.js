'use strict';

require('dotenv').config();

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
  const createTableSql = `CREATE TABLE remonline_private_api_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    refresh_token TEXT NOT NULL,
    access_token TEXT NOT NULL
  )`;

  db.runSql(createTableSql, function (err) {
    if (err) {
      console.log(err);
      return callback(err);
    }

    const initialRefreshToken =
      process.env.INITIAL_REMONLINE_PRIVATE_API_REFRESH_TOKEN;
    const initialAccessToken =
      process.env.INITIAL_REMONLINE_PRIVATE_API_ACCESS_TOKEN;

    if (!initialRefreshToken || !initialAccessToken) {
      console.log(
        'remonline_private_api_tokens: INITIAL_REMONLINE_PRIVATE_API_* tokens not provided in .env, skipping initial insert',
      );
      return callback();
    }

    const insertSql = `INSERT INTO remonline_private_api_tokens (refresh_token, access_token)
      VALUES (?, ?)`;

    db.runSql(insertSql, [initialRefreshToken, initialAccessToken], function (insertErr) {
      if (insertErr) {
        console.log(insertErr);
        // Even if the seed insert fails, we still complete the migration,
        // so you can manually insert tokens later.
      }
      callback();
    });
  });
};

exports.down = function (db, callback) {
  const sql = `DROP TABLE remonline_private_api_tokens`;
  db.runSql(sql, function (err) {
    if (err) return console.log(err);
    callback();
  });
};

exports._meta = {
  version: 1,
};

