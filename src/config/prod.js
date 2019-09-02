const knex = require('knex');

module.exports = {
  db: knex({
    client: 'sqlite3',
    connection: {
      filename: './.prod.sqlite',
    },
    useNullAsDefault: true,
  }),
};
