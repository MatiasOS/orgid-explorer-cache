/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const { expect, assert } = require('chai');

const { EXAMPLE_SNAPSHOT } = require('../utils');
const { resetDB } = require('../../src/db');
const { findAllCurrent, findByAddress, upsert } = require('../../src/db/permanent/models/snapshot');

describe('Snapshot DB', function () {
  beforeEach(async () => {
    await resetDB();
  });

  it('should be empty initially', async () => {
    const orgs = await findAllCurrent();
    expect(orgs.length).to.equal(0);
  });

  it('should return inserted data', async () => {
    await upsert(Object.assign({}, EXAMPLE_SNAPSHOT));

    const orgs = await findAllCurrent();
    expect(orgs.length).to.equal(1);
  });

  it('should search by address', async () => {
    await upsert(Object.assign({}, EXAMPLE_SNAPSHOT));

    const org = await findByAddress(EXAMPLE_SNAPSHOT.address);
    expect(org.address).to.equal(EXAMPLE_SNAPSHOT.address);
    expect(org.owner).to.equal(EXAMPLE_SNAPSHOT.owner);
  });

  it('should return null for unknown address', async () => {
    await upsert(Object.assign({}, EXAMPLE_SNAPSHOT));

    const org = await findByAddress('0x0');
    expect(org).to.be.null;
  });

  it('should work with no associated keys', async () => {
    const snapshot = Object.assign({}, EXAMPLE_SNAPSHOT);
    delete snapshot.associatedKeys;
    await upsert(snapshot);

    const org = await findByAddress('0x1');
    expect(org.associatedKeys).to.be.null;
  });

  it('should throw without owner', async () => {
    try {
      const snapshot = Object.assign({}, EXAMPLE_SNAPSHOT);
      delete snapshot.owner;
      await upsert(snapshot);
      assert(false, 'upsert should have thrown');
    } catch (e) {
      expect(e).to.match(/NOT NULL constraint failed: org_snapshots\.owner/);
    }
  });
});
