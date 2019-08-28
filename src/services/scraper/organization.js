const fetch = require('node-fetch');
const Web3 = require('web3');
const lib = require('zos-lib');
const Contracts = lib.Contracts;
const Organization = Contracts.getFromNodeModules('@windingtree/wt-contracts', 'Organization');
const LifDeposit = Contracts.getFromNodeModules('@windingtree/trust-clue-lif-deposit', 'LifDeposit');
const config = require('../../config');

const provider = new Web3.providers.HttpProvider(config.web3Provider);
const web3 = new Web3(provider);

async function findCoordinates(query){
  // TODO cache https://operations.osmfoundation.org/policies/nominatim/
  const uri = `https://nominatim.openstreetmap.org/search?format=json&email=info@windingtree.com&limit=1&q=${query}`;
  const response = await fetch(uri, { headers: { 'User-Agent': 'Winding Tree orgid-explorer scraper' }});
  const location = await response.json();
  if (location.length === 0) {
    return { lat: null, lon: null };
  }
  return location[0];
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
  res.associatedKeys = ','.join(associatedKeys);

  // off-chain
  const orgJsonResponse = await fetch(res.orgJsonUri);
  res.orgJsonContent = await orgJsonResponse.text();
  const orgJsonContent = JSON.parse(res.orgJsonContent);
  res.dateUpdated = new Date(orgJsonContent.updatedAt);

  res.city = orgJsonContent.legalEntity.address.city;
  res.name = orgJsonContent.legalEntity.name;

  const postal = orgJsonContent.legalEntity.address;
  const postalAddressString = `${postal.houseNumber} ${postal.road}, ${postal.city}, ${postal.postcode}, ${postal.countryCode}`;
  const { lat, lon } = await findCoordinates(postalAddressString);
  res.gpsCoordsLat = lat;
  res.gpsCoordsLon = lon;

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
