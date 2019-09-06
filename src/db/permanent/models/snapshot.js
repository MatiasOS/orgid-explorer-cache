const { _prepareSortingByDistance, _convertKilometersToDegrees } = require('../../../services/location/utils');
const { verifyLocationDistanceFormats, verifyLocationFormat } = require('../../../services/location/utils');
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

    table.primary(['address', 'timestamp']);

    table.index(['address']);
    table.index(['isLastSnapshot']);
    table.index(['isLastSnapshot', 'address']);
    table.index(['isLastSnapshot', 'city']);
    table.index(['isLastSnapshot', 'name']);
    table.index(['isLastSnapshot', 'segments']);
    table.index(['isLastSnapshot', 'dateCreated']);
    table.index(['isLastSnapshot', 'dateUpdated']);
    table.index(['isLastSnapshot', 'gpsCoordsLat']);
    table.index(['isLastSnapshot', 'gpsCoordsLon']);
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
    .then(function (inserted) {
      const itemCount = inserted.length || inserted.rowCount; // sqlite and psql return different results
      process.stdout.write(itemCount + ' organizations updated... ');
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
  delete organization.location_distance;
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
    const makeCaseInsensitive = db.client.config.client === 'sqlite3' ? 'COLLATE NOCASE' : '';
    res.push(`"${field}" ${makeCaseInsensitive} ${direction}`);
  }
  return res;
};

const applyFilter = (qs, filter) => {
  if (filter && filter.location) {
    if (!Array.isArray(filter.location)) {
      filter.location = [filter.location];
    }
    verifyLocationDistanceFormats(filter.location);

    qs.where('address', 'false'); // create always-false clause to start the `orWhere` chain
    for (let i = 0; i < filter.location.length; i++) {
      const split = filter.location[i].split(':');
      const distanceKm = split[1];
      const latLon = split[0].split(',');
      const lat = parseFloat(latLon[0]);
      const lon = parseFloat(latLon[1]);
      const distanceDeg = _convertKilometersToDegrees(lat, lon, distanceKm);
      qs.orWhere((builder) => {
        builder.whereBetween('gpsCoordsLat', [lat - distanceDeg.lat, lat + distanceDeg.lat]);
        builder.andWhereBetween('gpsCoordsLon', [lon - distanceDeg.lon, lon + distanceDeg.lon]);
      });
    }
  }
  if (filter && filter.dateCreatedFrom) {
    qs.where('dateCreated', '>=', new Date(filter.dateCreatedFrom).getTime());
  }
  if (filter && filter.dateCreatedTo) {
    qs.where('dateCreated', '<', new Date(filter.dateCreatedTo).getTime());
  }
  if (filter && filter.segments) {
    qs.where('segments', 'like', `%${filter.segments}%`);
  }
};

const applyPaging = (qs, filter) => {
  if (filter && filter.limit) {
    qs.limit(filter.limit);
  } else {
    qs.limit(20);
  }
  if (filter && filter.offset) {
    qs.offset(filter.offset);
  }
};

const prepareSortingByDistance = (qs, sortByDistance) => {
  verifyLocationFormat(sortByDistance);
  const split = sortByDistance.split(',');
  const lat = parseFloat(split[0]);
  const lon = parseFloat(split[1]);
  const clause = _prepareSortingByDistance(db(TABLE), lat, lon);
  return clause;
};

const findAllCurrent = async (filter, sortBy = '-dateCreated') => {
  let orderClause;
  const qs = db(TABLE).where({ isLastSnapshot: true });
  if (filter && filter.sortByDistance) {
    const clause = prepareSortingByDistance(qs, filter.sortByDistance);
    qs.select(clause);
    orderClause = 'location_distance asc';
  } else {
    orderClause = prepareSorting(sortBy);
  }
  applyFilter(qs, filter);
  const countQs = qs.clone();
  const totalCount = (await countQs.count())[0]['count(*)'];
  applyPaging(qs, filter);
  const items = await qs.orderByRaw(orderClause);
  for (const organization of items) {
    serialize(organization);
  }
  return { items, totalCount };
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
