const winston = require('winston');
require('dotenv').config();

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
  environments: {
    madrid: {
      entrypoint: '0xa268937c2573e2AB274BF6d96e88FfE0827F0D4D',
      lifDeposit: '0xfCfD5E296E4eD50B5F261b11818c50B73ED6c89E',
      provider: 'https://ropsten.infura.io/v3/7697444efe2e4751bc2f20f7f4549c36',
      active: true,
    },
    mainnet: {
      entrypoint: '0xefC87a66bDD18F3953B31fF60F47708B7690022b',
      lifDeposit: '0x37B9A2175B552FD54A5f8663e54c4b4693A696d0',
      provider: 'https://mainnet.infura.io/v3/7697444efe2e4751bc2f20f7f4549c36',
      active: true,
    },
  },
}, require(`./${env}`));
