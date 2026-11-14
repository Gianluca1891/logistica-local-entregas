class RutaRepositorio {
    constructor(db) {
        this.db = db;
    }

    async crear(ruta) {
        const resultado = await this.db.query(
            `INSERT INTO rutas (comercio_id, repartidor_id, solicitud_id, estado)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [ruta.comercioId, ruta.repartidorId, ruta.solicitudId, ruta.estado]
        );
        ruta.id = resultado.rows[0].id;

        for (const rutaPedido of ruta.rutaPedidos) {
            await this.db.query('INSERT INTO ruta_pedidos (ruta_id, pedido_id) VALUES ($1, $2)', [
                ruta.id,
                rutaPedido.pedidoId,
            ]);
        }
        return ruta;
    }
}

module.exports = RutaRepositorio;
