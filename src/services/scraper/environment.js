const Web3 = require('web3');
const lib = require('zos-lib');
const { scrapeOrganization } = require('./organization');
const Contracts = lib.Contracts;
const Entrypoint = Contracts.getFromNodeModules('@windingtree/wt-contracts', 'WindingTreeEntrypoint');
const { prepareToScrapeDirectory } = require('./directory');

const scrapeEnvironment = async function (envName, environment) {
  console.log(`Scraping environment ${envName}`);
  const provider = new Web3.providers.HttpProvider(environment.provider);
  const web3 = new Web3(provider);

  const entrypoint = Entrypoint.at(environment.entrypoint);
  entrypoint.setProvider(web3.currentProvider);

  const segmentCount = await entrypoint.methods.getSegmentsLength().call();
  const orgSegmentsIndex = {};
  for (let i = 1; i < segmentCount; i++) {
    const segmentName = await entrypoint.methods.getSegmentName(i).call();
    const segmentAddress = await entrypoint.methods.getSegment(segmentName).call();
    await prepareToScrapeDirectory(orgSegmentsIndex, segmentName, segmentAddress, environment.provider);
  }
  for (const orgAddress in orgSegmentsIndex) {
    await scrapeOrganization(orgAddress, orgSegmentsIndex[orgAddress], envName, environment.provider, environment.lifDeposit);
  }
};

module.exports = {
  scrapeEnvironment,
};
