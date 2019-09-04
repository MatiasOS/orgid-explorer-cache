const knex = require('knex');

module.exports = {
  baseUrl: 'https://explorer.myorgid.com',
  db: knex({
    client: 'pg',
    connection: {
      host: 'orgid-explorer-cache-db.ccv2mtbtm9st.eu-west-1.rds.amazonaws.com',
      user: 'postgres',
      password: process.env.DB_PASSWORD,
      database: 'orgid-explorer-cache-db',
    },
    useNullAsDefault: true,
  }),
};
