const fetch = require('node-fetch');
const Web3 = require('web3');
const lib = require('zos-lib');
const Contracts = lib.Contracts;
const Organization = Contracts.getFromNodeModules('@windingtree/wt-contracts', 'Organization');
const LifDeposit = Contracts.getFromNodeModules('@windingtree/trust-clue-lif-deposit', 'LifDeposit');
const Snapshot = require('../../db/permanent/models/snapshot');
const { db } = require('../../config');
const { TABLE: coordsCacheTableName, upsert: upsertCoordinatesCache } = require('../../db/permanent/models/coordinates');


async function findCoordinates(query){
  const cached = await db(coordsCacheTableName).where({ query: query });
  if (cached.length > 0) {
    process.stdout.write(`using coords from cache... `);
    return cached[0];
  }

  // https://operations.osmfoundation.org/policies/nominatim/
  const uri = `https://nominatim.openstreetmap.org/search?format=json&email=info@windingtree.com&limit=1&q=${query}`;
  const response = await fetch(uri, { headers: { 'User-Agent': 'Winding Tree orgid-explorer scraper' }});
  const location = await response.json();
  let res;
  if (location.length === 0) {
    res = { lat: null, lon: null };
  } else {
    res = location[0];
  }
  const coordsData = { query, gpsCoordsLat: res.lat, gpsCoordsLon: res.lon };
  await upsertCoordinatesCache(coordsData);
  return coordsData;
}

const scrapeOrganization = async function (envName, segment, orgAddress, providerAddress, lifDepositAddress) {
  process.stdout.write(`Scraping organization ${orgAddress}: `);
  const res = {
    environment: envName,
    segments: segment,
    address: orgAddress,
  };

  // on-chain
  process.stdout.write('on-chain... ');
  const provider = new Web3.providers.HttpProvider(providerAddress);
  const web3 = new Web3(provider);
  const hotel = Organization.at(orgAddress);
  hotel.setProvider(web3.currentProvider);

  res.owner = await hotel.methods.owner().call();
  res.orgJsonUri = await hotel.methods.orgJsonUri().call();
  res.orgJsonHash = await hotel.methods.orgJsonHash().call();
  const createdBlock = await hotel.methods.created().call();
  const createdTimestamp = (await web3.eth.getBlock(createdBlock)).timestamp;
  res.dateCreated = new Date(createdTimestamp * 1000);
  let associatedKeys = await hotel.methods.getAssociatedKeys().call();
  associatedKeys.shift(); // remove zeroeth item
  res.associatedKeys = associatedKeys.join(',');

  // off-chain
  process.stdout.write('off-chain... ');
  const orgJsonResponse = await fetch(res.orgJsonUri);
  res.orgJsonContent = await orgJsonResponse.text();
  const orgJsonContent = JSON.parse(res.orgJsonContent);
  res.dateUpdated = new Date(orgJsonContent.updatedAt);

  res.city = orgJsonContent.legalEntity.address.city;
  res.name = orgJsonContent.legalEntity.name;

  const postal = orgJsonContent.legalEntity.address;
  const postalAddressString = `${postal.houseNumber || ''} ${postal.road || ''}, ${postal.city || ''}, ${postal.postcode || ''}, ${postal.countryCode || ''}`;
  const { gpsCoordsLat, gpsCoordsLon } = await findCoordinates(postalAddressString);
  res.gpsCoordsLat = gpsCoordsLat;
  res.gpsCoordsLon = gpsCoordsLon;

  // deposit
  process.stdout.write('lif-deposit... ');
  const deposit = LifDeposit.at(lifDepositAddress);
  deposit.setProvider(web3.currentProvider);
  res.lifDepositValue = await deposit.methods.getDepositValue(orgAddress).call();

  res.timestamp = new Date();
  res.isLastSnapshot = true;

  await Snapshot.upsert(res);

  console.log('done.');
  return res;
};

module.exports = {
  scrapeOrganization,
};
