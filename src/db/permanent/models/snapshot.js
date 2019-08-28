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
    table.float('gpsCoordsLat');
    table.float('gpsCoordsLon');
    table.boolean('isLastSnapshot');

    table.unique(['address']);
    table.index(['address']);
    table.index(['isLastSnapshot', 'address']);
    table.index(['isLastSnapshot']);
    table.index(['city']);
    table.index(['name']);
    table.index(['gpsCoordsLat']);
    table.index(['gpsCoordsLon']);
  });
};

const dropTable = async () => {
  await db.schema.dropTableIfExists(TABLE);
};

const upsert = async (snapshotData) => {
  db.transaction((trx) => {
    return trx(TABLE).where({ address: snapshotData.address }).update({isLastSnapshot: false}).then(() => {
      return trx(TABLE).insert(snapshotData);
    });
  })
  .then(function(inserts) {
    console.log(inserts.length + ' organizations updated');
  })
  .catch((err) => console.error(err));
};

module.exports = {
  createTable,
  dropTable,
  upsert,
  // delete: delete_,
  // getHotelData,
  // getAddresses,
  // deleteObsoleteParts,
  TABLE,
};
