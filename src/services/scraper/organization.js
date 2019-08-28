const fetch = require('node-fetch');
const Web3 = require('web3');
const lib = require('zos-lib');
const Contracts = lib.Contracts;
const Organization = Contracts.getFromNodeModules('@windingtree/wt-contracts', 'Organization');
const LifDeposit = Contracts.getFromNodeModules('@windingtree/trust-clue-lif-deposit', 'LifDeposit');
const config = require('../../config');
const { TABLE: coordsCacheTableName, upsert: upsertCoordinatesCache } = require('../../db/permanent/models/coordinates');
const coordsCache = config.db(coordsCacheTableName);

const provider = new Web3.providers.HttpProvider(config.web3Provider);
const web3 = new Web3(provider);

async function findCoordinates(query){
  const cached = await coordsCache.where({ query: query });
  if (cached) {
    return cached;
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
  const coordsData = { query, lat: res.lat, lon: res.lon };
  await upsertCoordinatesCache(coordsData);
  return res;
}

const scrapeOrganization = async function (address) {
  const res = {
    address,
  };

  // on-chain
  const hotel = Organization.at(address);
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
  const deposit = LifDeposit.at(config.lifDepositAddress);
  deposit.setProvider(web3.currentProvider);
  res.lifDepositValue = await deposit.methods.getDepositValue(address).call();

  res.timestamp = new Date();
  res.isLastSnapshot = true;

  return res;
};

module.exports = {
  scrapeOrganization,
};
