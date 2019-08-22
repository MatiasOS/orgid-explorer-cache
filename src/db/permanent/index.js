const Snapshot = require('./models/snapshot');

/**
 * Create all necessary tables.
 *
 * @return {Promise<void>}
 */
const setupDB = async () => {
  await Snapshot.createTable();
};

/**
 * Bring the database to the initial empty state.
 *
 * @return {Promise<void>}
 */
const resetDB = async () => {
  await Snapshot.dropTable();
  await setupDB();
};

module.exports = {
  setupDB,
  resetDB,
};
