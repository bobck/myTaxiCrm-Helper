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

exports.up = function (db) {
  return db
    .createTable('robota_ua_sourced_candidates', {
      id: { type: 'int', primaryKey: true, autoIncrement: true },
      resume_id: { type: 'int', notNull: true, unique: true },
      keyword: { type: 'string' },
      city_id: { type: 'int' }, // New column
      created_at: {
        type: 'timestamp',
        notNull: true,
        defaultValue: new String('CURRENT_TIMESTAMP'),
      },
    })
    .then(() => {
      return db.addIndex(
        'robota_ua_sourced_candidates',
        'idx_robota_ua_sourced_candidates_resume_id',
        ['resume_id']
      );
    });
};

exports.down = function (db) {
  return db.dropTable('robota_ua_sourced_candidates');
};

exports._meta = {
  version: 1,
};
