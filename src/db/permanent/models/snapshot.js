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
  return db.transaction((trx) => {
    return trx(TABLE).where({ address: snapshotData.address }).update({ isLastSnapshot: false }).then(() => {
      snapshotData.isLastSnapshot = true;
      return trx(TABLE).insert(snapshotData);
    });
  })
    .then(function (inserts) {
      process.stdout.write(inserts.length + ' organizations updated... ');
    });
};

const serialize = function (organization) {
  for (const field of TIMESTAMP_FIELDS) {
    organization[field] = new Date(organization[field]);
  }
  if (organization.associatedKeys) {
    organization.associatedKeys = organization.associatedKeys.split(',');
  }
  delete organization.isLastSnapshot;
};

const prepareSorting = function (sortBy) {
  if (!Array.isArray(sortBy)) {
    sortBy = sortBy.split(',');
  }
  const res = [];
  for (let field of sortBy) {
    let direction = 'asc';
    if (field.startsWith('-')) {
      field = field.substring(1);
      direction = 'desc';
    }
    res.push(`${field} COLLATE NOCASE ${direction}`);
  }
  return res;
};

const applyFilter = (qs, filter) => {
  if (filter && filter.dateCreatedFrom) {
    qs.where('dateCreated', '>=', new Date(filter.dateCreatedFrom).getTime());
  }
  if (filter && filter.dateCreatedTo) {
    qs.where('dateCreated', '<', new Date(filter.dateCreatedTo).getTime());
  }
};

const findAllCurrent = async (filter, sortBy = '-dateCreated') => {
  const orderClause = prepareSorting(sortBy);
  const qs = db(TABLE).where({ isLastSnapshot: true }).orderByRaw(orderClause);
  applyFilter(qs, filter);
  const organizations = await qs;
  for (const organization of organizations) {
    serialize(organization);
  }
  return organizations;
};

const findByAddress = async (address) => {
  const organizations = await db(TABLE).where({ address: address, isLastSnapshot: true });
  if (organizations.length > 0) {
    const organization = organizations[0];
    serialize(organization);
    return organization;
  }
  return null;
};

module.exports = {
  createTable,
  dropTable,
  upsert,
  findAllCurrent,
  findByAddress,
  TABLE,
};
