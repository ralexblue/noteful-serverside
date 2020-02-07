
require('dotenv').config();

const { DATABASE_URL,TEST_DATABASE_URL,NODE_ENV } = require('./src/config');

module.exports = {
  "migrationsDirectory": "migrations",
  "driver": "pg",
  "connectionString": (NODE_ENV === 'test')
     ? TEST_DATABASE_URL
     : DATABASE_URL,
     "ssl": !!process.env.SSL,
}