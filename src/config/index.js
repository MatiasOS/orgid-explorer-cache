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
}, require(`./${env}`));
