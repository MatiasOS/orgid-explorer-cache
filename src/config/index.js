const winston = require('winston');

const env = process.env.WT_CONFIG || 'dev';

module.exports = Object.assign({
  port: 8008,
  baseUrl: process.env.BASE_URL || 'http://localhost:8008',
  logger: winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
        stderrLevels: ['error'],
      }),
    ],
  }),
  directories: ['0x2C29c421D7fd7Be4Cc2bfb6d1a44426E43021914'],
  lifDepositAddress: '0xfCfD5E296E4eD50B5F261b11818c50B73ED6c89E',
  web3Provider: 'https://ropsten.infura.io/v3/7697444efe2e4751bc2f20f7f4549c36',
}, require(`./${env}`));
