/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const request = require('supertest');

const { EXAMPLE_SNAPSHOT } = require('../utils');
const { resetDB } = require('../../src/db');
const { upsert } = require('../../src/db/permanent/models/snapshot');

describe('Organization Controller', function () {
  let server;
  before(() => {
    server = require('../../src/index');
  });
  after(() => {
    server.close();
  });
  beforeEach(async () => {
    await resetDB();
  });

  describe('GET /organizations', () => {
    it('should return empty when no data scraped', async () => {
      await request(server)
        .get('/organizations')
        .expect(200)
        .expect('content-type', /json/i)
        .expect((res) => {
          expect(res.body.length).to.equal(0);
        });
    });

    it('should return scraped data', async () => {
      const snapshotData1 = Object.assign({}, EXAMPLE_SNAPSHOT);
      const snapshotData2 = Object.assign({}, EXAMPLE_SNAPSHOT);
      snapshotData2.address = '0x2';
      await upsert(snapshotData1);
      await upsert(snapshotData2);

      await request(server)
        .get('/organizations')
        .expect(200)
        .expect('content-type', /json/i)
        .expect((res) => {
          expect(res.body.length).to.equal(2);
        });
    });
  });

  describe('GET /organizations/:address', () => {
    it('should return 200', async () => {
      await upsert(Object.assign({}, EXAMPLE_SNAPSHOT));

      await request(server)
        .get('/organizations/0x1')
        .expect(200)
        .expect('content-type', /json/i);
    });

    it('should return 404', async () => {
      await request(server)
        .get('/organizations/0x0')
        .expect(404);
    });
  });
});
