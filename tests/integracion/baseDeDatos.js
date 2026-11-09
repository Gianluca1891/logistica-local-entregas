const pool = require('../../src/infraestructura/db');

async function limpiarBase() {
    await pool.query(
        'TRUNCATE usuarios, comercios, repartidores, productos, pedidos, pedido_items, rutas, ruta_pedidos, posiciones RESTART IDENTITY CASCADE'
    );
}

async function crearComercio(nombre) {
    const usuario = await pool.query(
        "INSERT INTO usuarios (email, password_hash, rol) VALUES ($1, 'x', 'comercio') RETURNING id",
        [`${nombre}@test.com`]
    );
    const comercio = await pool.query(
        "INSERT INTO comercios (usuario_id, nombre, direccion, latitud, longitud) VALUES ($1, $2, 'Calle 123', -34.6, -58.4) RETURNING id",
        [usuario.rows[0].id, nombre]
    );
    return comercio.rows[0].id;
}

module.exports = { pool, limpiarBase, crearComercio };