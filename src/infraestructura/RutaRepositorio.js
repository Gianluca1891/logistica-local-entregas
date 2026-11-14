const Ruta = require('../dominio/Ruta');
const RutaPedido = require('../dominio/RutaPedido');

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
    async buscarParaActualizar(id) {
        const rutas = await this.db.query('SELECT * FROM rutas WHERE id = $1 FOR UPDATE', [id]);
        if (rutas.rows.length === 0) {
            return null;
        }
        const fila = rutas.rows[0];
        const pedidos = await this.db.query(
            'SELECT pedido_id, orden FROM ruta_pedidos WHERE ruta_id = $1 ORDER BY pedido_id',
            [id]
        );
        return new Ruta({
            id: fila.id,
            comercioId: fila.comercio_id,
            repartidorId: fila.repartidor_id,
            solicitudId: fila.solicitud_id,
            estado: fila.estado,
            rutaPedidos: pedidos.rows.map((p) => new RutaPedido({ pedidoId: p.pedido_id, orden: p.orden })),
        });
    }

    async guardarOrden(ruta) {
        for (const rutaPedido of ruta.rutaPedidos) {
            await this.db.query('UPDATE ruta_pedidos SET orden = $1 WHERE ruta_id = $2 AND pedido_id = $3', [
                rutaPedido.orden,
                ruta.id,
                rutaPedido.pedidoId,
            ]);
        }
        await this.db.query('UPDATE rutas SET estado = $1 WHERE id = $2', [ruta.estado, ruta.id]);
    }
}

module.exports = RutaRepositorio;
