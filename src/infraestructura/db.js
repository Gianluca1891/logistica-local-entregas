const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://logistica:logistica@localhost:5432/logistica',
});

pool.on('error', (error) => console.error('Se perdio una conexion con la base:', error.message));

module.exports = pool;
