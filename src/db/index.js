const Permanent = require('./permanent');

/**
 * Create all necessary tables.
 *
 * @return {Promise<void>}
 */
const setupDB = async () => {
  await Promise.all([
    Permanent.setupDB(),
  ]);
};

/**
 * Bring the database to the initial empty state.
 *
 * @return {Promise<void>}
 */
const resetDB = async () => {
  console.log('Resetting DB');
  await Promise.all([
    Permanent.resetDB(),
  ]);
};

module.exports = {
  setupDB,
  resetDB,
};
