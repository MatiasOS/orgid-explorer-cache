/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const { expect, assert } = require('chai');

const { resetDB } = require('../../src/db');
const { find, upsert } = require('../../src/db/permanent/models/coordinates');

const EXAMPLE_COORD = {
  query: 'Street 1, City',
  gpsCoordsLat: 5,
  gpsCoordsLon: 15,
};

describe('Coordinates cache DB', function () {
  beforeEach(async () => {
    await resetDB();
  });

  it('should be empty initially', async () => {
    const coords = await find({});
    expect(coords.length).to.equal(0);
  });

  it('should return inserted data', async () => {
    await upsert(Object.assign({}, EXAMPLE_COORD));

    const coords = await find({});
    expect(coords.length).to.equal(1);
    expect(coords[0].query).to.equal(EXAMPLE_COORD.query);
  });

  it('should work with null values', async () => {
    const coordsData = Object.assign({}, EXAMPLE_COORD);
    coordsData.gpsCoordsLat = null;
    coordsData.gpsCoordsLon = null;
    await upsert(coordsData);

    const coords = await find({ query: coordsData.query });
    expect(coords.length).to.equal(1);
    expect(coords[0].gpsCoordsLat).to.be.null;
    expect(coords[0].gpsCoordsLon).to.be.null;
  });

  it('should throw for null query', async () => {
    const coordsData = Object.assign({}, EXAMPLE_COORD);
    coordsData.query = null;
    try {
      await upsert(coordsData);
      assert(false, 'upsert should have thrown');
    } catch (e) {
      expect(e).to.match(/NOT NULL constraint failed: coords_cache\.query/);
    }
  });
});
