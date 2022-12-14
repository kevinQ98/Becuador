const { createPool } = require("mysql2/promise");
const { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER } = require("./config");

const pool = createPool({
  user: DB_USER,
  password: DB_PASSWORD,
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
});

module.exports = { pool };
