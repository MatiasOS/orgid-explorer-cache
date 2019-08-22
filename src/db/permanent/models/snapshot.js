const { db } = require('../../../config');

const TABLE = 'org_snapshots';
const STRING_FIELDS = ['segments', 'city', 'name', 'environment', 'orgJsonHash', 'orgJsonUri', 'associatedKeys'];
const TIMESTAMP_FIELDS = ['dateCreated', 'dateUpdated', 'timestamp'];

const createTable = async () => {
  await db.schema.createTable(TABLE, (table) => {
    for (const fieldName of STRING_FIELDS) {
      table.string(fieldName);
    }
    for (const fieldName of TIMESTAMP_FIELDS) {
      table.timestamp(fieldName, { useTz: true });
    }
    table.string('address', 63).notNullable();
    table.string('owner', 63).notNullable();
    table.jsonb('orgJsonContent');
    table.float('lifDepositValue');
    table.float('gps_coords_lat');
    table.float('gps_coords_lon');

    table.unique(['address']);
    table.index(['address']);
    table.index(['city']);
    table.index(['name']);
    table.index(['gps_coords_lat']);
    table.index(['gps_coords_lon']);
  });
};

const dropTable = async () => {
  await db.schema.dropTableIfExists(TABLE);
};

module.exports = {
  createTable,
  dropTable,
  // upsert,
  // delete: delete_,
  // getHotelData,
  // getAddresses,
  // deleteObsoleteParts,
  TABLE,
};
