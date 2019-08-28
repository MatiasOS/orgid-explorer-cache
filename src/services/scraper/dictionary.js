const Web3 = require('web3');
const lib = require('zos-lib');
const Contracts = lib.Contracts;
const SegmentDirectory = Contracts.getFromNodeModules('@windingtree/wt-contracts', 'SegmentDirectory');
const config = require('../../config');
const { scrapeOrganization } = require('./organization');
const Snapshot = require('../../db/permanent/models/snapshot');

const provider = new Web3.providers.HttpProvider(config.web3Provider);
const web3 = new Web3(provider);

const scrapeDictionary = async function (address) {
  const dictionary = SegmentDirectory.at(address);
  dictionary.setProvider(web3.currentProvider);

  const segment = await dictionary.methods.getSegment().call();
  const organizations = await dictionary.methods.getOrganizations().call();

  console.log(segment);
  console.log(organizations);

  for (const orgAddress of organizations) {
    if (orgAddress !== '0x0000000000000000000000000000000000000000') {
      const snapshot = await scrapeOrganization(orgAddress);
      await Snapshot.upsert(snapshot);
    }
  }
};

module.exports = {
  scrapeDictionary,
};