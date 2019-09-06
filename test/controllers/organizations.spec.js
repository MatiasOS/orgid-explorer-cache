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
            expect(res.body.items.length).to.equal(0);
            expect(res.body.totalCount).to.equal(0);
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
            expect(res.body.items.length).to.equal(2);
            expect(res.body.totalCount).to.equal(2);
          });
      });
    });

    describe('sorting', () => {
      let snapshotData1, snapshotData2, snapshotData3;

      before(async () => {
        await resetDB();
        snapshotData1 = Object.assign({}, EXAMPLE_SNAPSHOT);
        snapshotData2 = Object.assign({}, EXAMPLE_SNAPSHOT);
        snapshotData3 = Object.assign({}, EXAMPLE_SNAPSHOT);
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
        snapshotData1.gpsCoordsLat = 1;
        snapshotData1.gpsCoordsLon = 1;
        snapshotData2.gpsCoordsLat = 20;
        snapshotData2.gpsCoordsLon = 20;
        snapshotData3.gpsCoordsLat = 30;
        snapshotData3.gpsCoordsLon = 30;
        await upsert(snapshotData1);
        await upsert(snapshotData3);
        await upsert(snapshotData2);
      });

      it('should sort by address', async () => {
        await request(server)
          .get('/organizations?sortingField=address')
          .expect(200)
          .expect((res) => {
            expect(res.body.items[0].address).to.equal('0x1');
            expect(res.body.items[1].address).to.equal('0x2');
            expect(res.body.items[2].address).to.equal('0x3');
          });
      });

      it('should sort by dateCreated', async () => {
        await request(server)
          .get('/organizations?sortingField=dateCreated')
          .expect(200)
          .expect((res) => {
            expect(res.body.items[0].address).to.equal('0x3');
            expect(res.body.items[1].address).to.equal('0x1');
            expect(res.body.items[2].address).to.equal('0x2');
          });
      });

      it('should sort by dateUpdated', async () => {
        await request(server)
          .get('/organizations?sortingField=dateUpdated')
          .expect(200)
          .expect((res) => {
            expect(res.body.items[0].address).to.equal('0x2');
            expect(res.body.items[1].address).to.equal('0x1');
            expect(res.body.items[2].address).to.equal('0x3');
          });
      });

      it('should sort by name', async () => {
        await request(server)
          .get('/organizations?sortingField=name')
          .expect(200)
          .expect((res) => {
            expect(res.body.items[0].address).to.equal('0x3');
            expect(res.body.items[1].address).to.equal('0x1');
            expect(res.body.items[2].address).to.equal('0x2');
          });
      });

      it('should sort by city', async () => {
        await request(server)
          .get('/organizations?sortingField=city')
          .expect(200)
          .expect((res) => {
            expect(res.body.items[0].address).to.equal('0x3');
            expect(res.body.items[1].address).to.equal('0x1');
            expect(res.body.items[2].address).to.equal('0x2');
          });
      });

      it('should sort by segments', async () => {
        await request(server)
          .get('/organizations?sortingField=segments')
          .expect(200)
          .expect((res) => {
            expect(res.body.items[0].address).to.equal('0x3');
            expect(res.body.items[1].address).to.equal('0x1');
            expect(res.body.items[2].address).to.equal('0x2');
          });
      });

      it('should sort in reverse direction', async () => {
        await request(server)
          .get('/organizations?sortingField=-address')
          .expect(200)
          .expect((res) => {
            expect(res.body.items[0].address).to.equal('0x3');
            expect(res.body.items[1].address).to.equal('0x2');
            expect(res.body.items[2].address).to.equal('0x1');
          });
      });

      it('should sort by dateCreated in reverse direction', async () => {
        await request(server)
          .get('/organizations?sortingField=-dateCreated')
          .expect(200)
          .expect((res) => {
            expect(res.body.items[0].address).to.equal('0x2');
            expect(res.body.items[1].address).to.equal('0x1');
            expect(res.body.items[2].address).to.equal('0x3');
          });
      });

      it('should sort by multiple fields', async () => {
        snapshotData3.name = 'ZZZ';
        snapshotData3.timestamp = new Date();
        await upsert(snapshotData3);

        await request(server)
          .get('/organizations?sortingField=-name,city')
          .expect(200)
          .expect((res) => {
            expect(res.body.items[0].address).to.equal('0x3');
            expect(res.body.items[1].address).to.equal('0x2');
            expect(res.body.items[2].address).to.equal('0x1');
          });
      });

      it('should sort by distance from location', async () => {
        await request(server)
          .get('/organizations?sortByDistance=10,20')
          .expect(200)
          .expect((res) => {
            expect(res.body.items[0].address).to.equal('0x2');
            expect(res.body.items[1].address).to.equal('0x1');
            expect(res.body.items[2].address).to.equal('0x3');
          });
      });

      it('should throw when sorting by distance and fields', async () => {
        await request(server)
          .get('/organizations?sortByDistance=50.08,14.44&sortingField=name')
          .expect(400)
          .expect((res) => {
            expect(res.body.message).to.equal('Can\'t sort by both distance and fields.');
          });
      });

      it('should throw on invalid location specification', async () => {
        await request(server)
          .get('/organizations?sortByDistance=50.08:14.44')
          .expect(400)
          .expect((res) => {
            expect(res.body.code).to.match(/Invalid lat,lon format/);
          });
      });
    });

    describe('filtering', () => {
      let dateLimitFrom, dateLimitTo;

      const formatDate = (date) => {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
      };

      before(async () => {
        await resetDB();
        const snapshotData1 = Object.assign({}, EXAMPLE_SNAPSHOT);
        const snapshotData2 = Object.assign({}, EXAMPLE_SNAPSHOT);
        const snapshotData3 = Object.assign({}, EXAMPLE_SNAPSHOT);
        snapshotData2.address = '0x2';
        snapshotData3.address = '0x3';
        snapshotData1.dateCreated = new Date();
        snapshotData2.dateCreated = dateFuture(10);
        snapshotData3.dateCreated = datePast(10);
        snapshotData3.segments = 'hotels,otas';
        snapshotData1.gpsCoordsLat = 1;
        snapshotData1.gpsCoordsLon = 1;
        snapshotData2.gpsCoordsLat = 20;
        snapshotData2.gpsCoordsLon = 20;
        snapshotData3.gpsCoordsLat = 30;
        snapshotData3.gpsCoordsLon = 30;
        await upsert(snapshotData1);
        await upsert(snapshotData3);
        await upsert(snapshotData2);

        dateLimitFrom = datePast(5);
        dateLimitTo = dateFuture(5);
      });

      it('should filter by date created', async () => {
        await request(server)
          .get(`/organizations?dateCreatedFrom=${formatDate(dateLimitFrom)}&dateCreatedTo=${formatDate(dateLimitTo)}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.items.length).to.equal(1);
            expect(res.body.items[0].address).to.equal('0x1');
          });
      });

      it('should filter by date created upper limit', async () => {
        await request(server)
          .get(`/organizations?dateCreatedTo=${formatDate(dateLimitTo)}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.items.length).to.equal(2);
            expect(res.body.items[0].address).to.equal('0x1');
            expect(res.body.items[1].address).to.equal('0x3');
          });
      });

      it('should filter by date created lower limit', async () => {
        await request(server)
          .get(`/organizations?dateCreatedFrom=${formatDate(dateLimitFrom)}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.items.length).to.equal(2);
            expect(res.body.items[0].address).to.equal('0x2');
            expect(res.body.items[1].address).to.equal('0x1');
          });
      });

      it('should filter by segments', async () => {
        await request(server)
          .get('/organizations?segments=otas')
          .expect(200)
          .expect((res) => {
            expect(res.body.items.length).to.equal(1);
            expect(res.body.items[0].address).to.equal('0x3');
          });
      });

      it('should filter by location', async () => {
        await request(server)
          .get('/organizations?location=40,40:2000')
          .expect(200)
          .expect((res) => {
            expect(res.body.items.length).to.equal(1);
            expect(res.body.items[0].address).to.equal('0x3');
          });
      });

      it('should filter by locations', async () => {
        await request(server)
          .get('/organizations?location=40,40:2000&location=20,20:1')
          .expect(200)
          .expect((res) => {
            expect(res.body.items.length).to.equal(2);
            expect(res.body.items[0].address).to.equal('0x2');
            expect(res.body.items[1].address).to.equal('0x3');
          });
      });

      it('should filter by locations and fields', async () => {
        await request(server)
          .get('/organizations?location=40,40:2000&segments=otas')
          .expect(200)
          .expect((res) => {
            expect(res.body.items.length).to.equal(1);
            expect(res.body.items[0].address).to.equal('0x3');
          });
      });

      it('should throw on invalid locations', async () => {
        await request(server)
          .get('/organizations?location=40,40,20')
          .expect(400)
          .expect((res) => {
            expect(res.body.code).to.match(/Invalid lat,lon:distance format/);
          });
      });
    });

    describe('paging', () => {
      before(async () => {
        await resetDB();
        for (let i = 1; i <= 50; i++) {
          const snapshotData = Object.assign({}, EXAMPLE_SNAPSHOT);
          snapshotData.address = `0x${i}`;
          await upsert(snapshotData);
        }
      });

      it('should page by default', async () => {
        await request(server)
          .get('/organizations')
          .expect(200)
          .expect((res) => {
            expect(res.body.items.length).to.equal(20);
            expect(res.body.totalCount).to.equal(50);
          });
      });

      it('should limit', async () => {
        await request(server)
          .get('/organizations?limit=5&sortingField=dateCreated')
          .expect(200)
          .expect((res) => {
            expect(res.body.items.length).to.equal(5);
            expect(res.body.items[0].address).to.equal('0x1');
            expect(res.body.totalCount).to.equal(50);
          });
      });

      it('should offset', async () => {
        await request(server)
          .get('/organizations?limit=5&offset=5&sortingField=dateCreated')
          .expect(200)
          .expect((res) => {
            expect(res.body.items.length).to.equal(5);
            expect(res.body.items[0].address).to.equal('0x6');
            expect(res.body.totalCount).to.equal(50);
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
