const knex = require('knex');

module.exports = {
  baseUrl: 'https://explorer-cache.myorgid.com',
  db: knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'orgid-explorer-cache-db.ccv2mtbtm9st.eu-west-1.rds.amazonaws.com',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'orgid-explorer-cache-db',
    },
    useNullAsDefault: true,
  }),
};
