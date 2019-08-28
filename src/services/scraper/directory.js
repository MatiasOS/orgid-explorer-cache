const Web3 = require('web3');
const lib = require('zos-lib');
const Contracts = lib.Contracts;
const SegmentDirectory = Contracts.getFromNodeModules('@windingtree/wt-contracts', 'SegmentDirectory');
const { scrapeOrganization } = require('./organization');


const scrapeDirectory = async function (envName, address, providerAddress, lifDepositAddress) {
  const provider = new Web3.providers.HttpProvider(providerAddress);
  const web3 = new Web3(provider);

  const dictionary = SegmentDirectory.at(address);
  dictionary.setProvider(web3.currentProvider);

  const segment = await dictionary.methods.getSegment().call();
  console.log(`Scraping segment ${segment}`);
  const organizations = await dictionary.methods.getOrganizations().call();

  for (const orgAddress of organizations) {
    if (orgAddress !== '0x0000000000000000000000000000000000000000') {
      await scrapeOrganization(envName, segment, orgAddress, providerAddress, lifDepositAddress);
    }
  }
};

module.exports = {
  scrapeDirectory,
};