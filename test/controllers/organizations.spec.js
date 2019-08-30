/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const request = require('supertest');

const { EXAMPLE_SNAPSHOT, datePast, dateFuture } = require('../utils');
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

  describe('GET /organizations', () => {
    describe('basic', () => {
      beforeEach(async () => {
        await resetDB();
      });
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

    describe('sorting', () => {
      before(async () => {
        const snapshotData1 = Object.assign({}, EXAMPLE_SNAPSHOT);
        const snapshotData2 = Object.assign({}, EXAMPLE_SNAPSHOT);
        const snapshotData3 = Object.assign({}, EXAMPLE_SNAPSHOT);
        snapshotData2.address = '0x2';
        snapshotData3.address = '0x3';
        snapshotData2.dateCreated = dateFuture();
        snapshotData3.dateCreated = datePast();
        snapshotData2.dateUpdated = datePast();
        snapshotData3.dateUpdated = dateFuture();
        snapshotData2.name = 'ZZZ';
        snapshotData3.name = 'aaa';
        snapshotData2.city = 'ZZZ';
        snapshotData3.city = 'aaa';
        snapshotData2.segments = 'otas';
        snapshotData3.segments = 'airlines';
        await upsert(snapshotData1);
        await upsert(snapshotData3);
        await upsert(snapshotData2);
      });

      it('should sort by address', async () => {
        await request(server)
          .get('/organizations?sortingField=address')
          .expect(200)
          .expect((res) => {
            expect(res.body[0].address).to.equal('0x1');
            expect(res.body[1].address).to.equal('0x2');
            expect(res.body[2].address).to.equal('0x3');
          });
      });

      it('should sort by dateCreated', async () => {
        await request(server)
          .get('/organizations?sortingField=dateCreated')
          .expect(200)
          .expect((res) => {
            expect(res.body[0].address).to.equal('0x3');
            expect(res.body[1].address).to.equal('0x1');
            expect(res.body[2].address).to.equal('0x2');
          });
      });

      it('should sort by dateUpdated', async () => {
        await request(server)
          .get('/organizations?sortingField=dateUpdated')
          .expect(200)
          .expect((res) => {
            expect(res.body[0].address).to.equal('0x2');
            expect(res.body[1].address).to.equal('0x1');
            expect(res.body[2].address).to.equal('0x3');
          });
      });

      it('should sort by name', async () => {
        await request(server)
          .get('/organizations?sortingField=name')
          .expect(200)
          .expect((res) => {
            expect(res.body[0].address).to.equal('0x3');
            expect(res.body[1].address).to.equal('0x1');
            expect(res.body[2].address).to.equal('0x2');
          });
      });

      it('should sort by city', async () => {
        await request(server)
          .get('/organizations?sortingField=city')
          .expect(200)
          .expect((res) => {
            expect(res.body[0].address).to.equal('0x3');
            expect(res.body[1].address).to.equal('0x1');
            expect(res.body[2].address).to.equal('0x2');
          });
      });

      it('should sort by segments', async () => {
        await request(server)
          .get('/organizations?sortingField=segments')
          .expect(200)
          .expect((res) => {
            expect(res.body[0].address).to.equal('0x3');
            expect(res.body[1].address).to.equal('0x1');
            expect(res.body[2].address).to.equal('0x2');
          });
      });

      it('should sort in reverse direction', async () => {
        await request(server)
          .get('/organizations?sortingField=-address')
          .expect(200)
          .expect((res) => {
            expect(res.body[0].address).to.equal('0x3');
            expect(res.body[1].address).to.equal('0x2');
            expect(res.body[2].address).to.equal('0x1');
          });
      });

      it('should sort by dateCreated in reverse direction', async () => {
        await request(server)
          .get('/organizations?sortingField=-dateCreated')
          .expect(200)
          .expect((res) => {
            expect(res.body[0].address).to.equal('0x2');
            expect(res.body[1].address).to.equal('0x1');
            expect(res.body[2].address).to.equal('0x3');
          });
      });

      it('should sort by multiple fields', async () => {
        const snapshotData4 = Object.assign({}, EXAMPLE_SNAPSHOT);
        snapshotData4.address = '0x4';
        snapshotData4.name = 'ZZZ';
        snapshotData4.city = 'AAA';
        await upsert(snapshotData4);

        await request(server)
          .get('/organizations?sortingField=-name,city')
          .expect(200)
          .expect((res) => {
            expect(res.body[0].address).to.equal('0x4');
            expect(res.body[1].address).to.equal('0x2');
            expect(res.body[2].address).to.equal('0x1');
            expect(res.body[3].address).to.equal('0x3');
          });
      });
    });
  });

  describe('GET /organizations/:address', () => {
    beforeEach(async () => {
      await resetDB();
    });
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
