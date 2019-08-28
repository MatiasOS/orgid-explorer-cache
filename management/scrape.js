const { scrapeEnvironment } = require('../src/services/scraper/environment');
const { environments } = require('../src/config');
const { resetDB } = require('../src/db/');

async function main(reinitDb) {
  try {
    if (reinitDb) {
      await resetDB();
    }
    for (const name in environments) {
      const environment = environments[name];
      if (environment.active) {
        await scrapeEnvironment(name, environment);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

let reinitDb = false;
if (process.argv.length > 2) {
  if (process.argv[2] === '--help') {
    console.log('Usage: node scrape.js [--reinit]');
    process.exit(0);
  }
  if (process.argv[2] === '--reinit') {
    reinitDb = true;
  }
}
main(reinitDb);
