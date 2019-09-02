const knex = require('knex');

module.exports = {
  baseUrl: 'https://explorer.myorgid.com',
  db: knex({
    client: 'sqlite3',
    connection: {
      filename: './.prod.sqlite',
    },
    useNullAsDefault: true,
  }),
};
