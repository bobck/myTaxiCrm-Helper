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
                                            bitrix_card_id INTEGER UNIQUE PRIMARY KEY,
                                            driver_id UUID NOT NULL,
                                            full_name TEXT NOT NULL,
                                            auto_park_id UUID NOT NULL,
                                            cs_current_week INTEGER NOT NULL,
                                            cs_current_year INTEGER NOT NULL,
                                            current_week_balance DECIMAL NOT NULL,
                                            current_week_total_deposit DECIMAL NOT NULL,
                                            current_week_total_debt DECIMAL NOT NULL,
                                            fire_date DATE,
                                            is_balance_enabled BOOLEAN ,
                                            balance_activation_value DECIMAL ,
                                            is_deposit_enabled BOOLEAN,
                                            deposit_activation_value DECIMAL,
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
