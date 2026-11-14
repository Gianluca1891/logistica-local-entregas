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
    
    async listarPorComercio(comercioId) {
        const resultado = await this.db.query(
            `SELECT r.id, r.estado, rep.nombre AS repartidor,
                    rp.orden, p.id AS pedido_id, p.cliente_nombre, p.direccion_destino,
                    p.latitud_destino, p.longitud_destino, p.estado AS pedido_estado
             FROM rutas r
             JOIN repartidores rep ON rep.id = r.repartidor_id
             JOIN ruta_pedidos rp ON rp.ruta_id = r.id
             JOIN pedidos p ON p.id = rp.pedido_id
             WHERE r.comercio_id = $1
             ORDER BY r.id DESC, rp.orden NULLS LAST, p.id`,
            [comercioId]
        );

        const rutas = new Map();
        for (const fila of resultado.rows) {
            if (!rutas.has(fila.id)) {
                rutas.set(fila.id, { id: fila.id, estado: fila.estado, repartidor: fila.repartidor, paradas: [] });
            }
            rutas.get(fila.id).paradas.push({
                orden: fila.orden,
                pedidoId: fila.pedido_id,
                nombreCliente: fila.cliente_nombre,
                direccionDestino: fila.direccion_destino,
                latitud: fila.latitud_destino,
                longitud: fila.longitud_destino,
                estado: fila.pedido_estado,
            });
        }
        return [...rutas.values()];
    }
}

module.exports = RutaRepositorio;
