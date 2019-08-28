const { db } = require('../../../config');

const TABLE = 'coords_cache';

const createTable = async () => {
  await db.schema.createTable(TABLE, (table) => {
    table.string('query').notNullable();
    table.float('gpsCoordsLat');
    table.float('gpsCoordsLon');
    table.timestamp('dateCached', { useTz: true });

    table.unique(['query']);
    table.index(['query']);
  });
};

const dropTable = async () => {
  await db.schema.dropTableIfExists(TABLE);
};

const upsert = async (coordsData) => {
  coordsData.dateCached = new Date();
  return db(TABLE).where({ query: coordsData.query }).delete()
  .then(function(deleted) {
    return db(TABLE).insert(coordsData).then(function(inserted) {
      process.stdout.write(inserted.length + ' coordinates inserted... ');
    });
  })
  .catch((err) => console.error(err));
};

module.exports = {
  createTable,
  dropTable,
  upsert,
  TABLE,
};
