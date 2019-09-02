const EXAMPLE_SNAPSHOT = {
  address: '0x1',
  owner: '0x2',
  associatedKeys: '0x3',
  orgJsonContent: '{}',
  lifDepositValue: 25000000000000000000,
  gpsCoordsLat: 5,
  gpsCoordsLon: 15,
  segments: 'hotels',
  city: 'Prague',
  name: 'Test ORG.ID',
  environment: 'test',
  orgJsonHash: '0x123456',
  orgJsonUri: 'http://uri.json/',
  dateCreated: new Date(),
  dateUpdated: new Date(),
  timestamp: new Date(),
};

const dateFuture = (offset = 10) => {
  const res = new Date();
  res.setDate(res.getDate() + offset);
  return res;
};

const datePast = (offset = 10) => {
  const res = new Date();
  res.setDate(res.getDate() - offset);
  return res;
};

module.exports = {
  EXAMPLE_SNAPSHOT,
  dateFuture,
  datePast,
};
