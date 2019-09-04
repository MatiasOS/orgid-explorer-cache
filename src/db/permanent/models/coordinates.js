const { db } = require('../../../config');

const TABLE = 'coords_cache';

const createTable = async () => {
  await db.schema.createTable(TABLE, (table) => {
    table.string('query').notNullable().primary();
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
  await db(TABLE).where({ query: coordsData.query }).delete().catch((err) => console.error(err));
  return db(TABLE).insert(coordsData).then(function (inserted) {
    const itemCount = inserted.length || inserted.rowCount; // sqlite and psql return different results
    process.stdout.write(itemCount + ' coordinates inserted... ');
  });
};

const find = async (query) => {
  return db(TABLE).where(query);
};

module.exports = {
  createTable,
  dropTable,
  upsert,
  find,
  TABLE,
};
