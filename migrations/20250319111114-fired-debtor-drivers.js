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
      CREATE TABLE fired_debtor_drivers (
                                            driver_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                            full_name TEXT NOT NULL,
                                            auto_park_id UUID NOT NULL,
                                            cs_current_week INTEGER NOT NULL,
                                            cs_current_year INTEGER NOT NULL,
                                            current_week_balance DECIMAL NOT NULL,
                                            current_week_total_deposit DECIMAL NOT NULL,
                                            current_week_total_debt DECIMAL NOT NULL,
                                            fire_date DATE NOT NULL,
                                            is_balance_enabled BOOLEAN NOT NULL,
                                            balance_activation_value DECIMAL NOT NULL,
                                            is_deposit_enabled BOOLEAN NOT NULL,
                                            deposit_activation_value DECIMAL NOT NULL,
                                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
  `;
  db.runSql(sql, callback);
};

exports.down = function (db) {
  const sql = `
      DROP TABLE fired_debtor_drivers;
  `;
  db.runSql(sql, callback);
};

exports._meta = {
  version: 1,
};
