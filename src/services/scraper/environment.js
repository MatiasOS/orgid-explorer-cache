const Web3 = require('web3');
const lib = require('zos-lib');
const Contracts = lib.Contracts;
const Entrypoint = Contracts.getFromNodeModules('@windingtree/wt-contracts', 'WindingTreeEntrypoint');
const { scrapeDirectory } = require('./directory');


const scrapeEnvironment = async function (envName, environment) {
  console.log(`Scraping environment ${envName}`);
  const provider = new Web3.providers.HttpProvider(environment.provider);
  const web3 = new Web3(provider);

  const entrypoint = Entrypoint.at(environment.entrypoint);
  entrypoint.setProvider(web3.currentProvider);

  const segmentCount = await entrypoint.methods.getSegmentsLength().call();
  for (let i = 1; i < segmentCount; i++) {
    const segmentName = await entrypoint.methods.getSegmentName(i).call();
    const segment = await entrypoint.methods.getSegment(segmentName).call();
    await scrapeDirectory(envName, segment, environment.provider, environment.lifDeposit);
  }
};

module.exports = {
  scrapeEnvironment,
};