const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://logistica:logistica@localhost:5432/logistica',
});

module.exports = pool;