/**
 * Adds created_at and updated_at columns to the drivers_ignoring_cash_block_rules table.
 * This is done in multiple steps to work around SQLite limitations.
 */
exports.up = function (db, callback) {
  // Step 1: Add the created_at column without a default value
  const addCreatedAtSql = `
    ALTER TABLE drivers_ignoring_cash_block_rules
    ADD COLUMN created_at TIMESTAMP
  `;

  db.runSql(addCreatedAtSql, function (err) {
    if (err) {
      return callback(err);
    }

    // Step 2: Add the updated_at column without a default value
    const addUpdatedAtSql = `
      ALTER TABLE drivers_ignoring_cash_block_rules
      ADD COLUMN updated_at TIMESTAMP
    `;

    db.runSql(addUpdatedAtSql, function (err) {
      if (err) {
        return callback(err);
      }

      // Step 3: Update all existing rows to set the timestamps
      const updateTimestampsSql = `
        UPDATE drivers_ignoring_cash_block_rules
        SET
          created_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `;
      db.runSql(updateTimestampsSql, callback); // Final callback ends the migration
    });
  });
};
