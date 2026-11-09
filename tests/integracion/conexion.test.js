const pool = require('../../src/infraestructura/db');

afterAll(() => pool.end());

test('se conecta a PostgreSQL', async () => {
    const resultado = await pool.query('SELECT 1 + 1 AS suma');
    expect(resultado.rows[0].suma).toBe(2);
});

test('el esquema tiene las 9 tablas', async () => {
    const resultado = await pool.query(
        "SELECT COUNT(*)::int AS cantidad FROM information_schema.tables WHERE table_schema = 'public'"
    );
    expect(resultado.rows[0].cantidad).toBe(9);
});