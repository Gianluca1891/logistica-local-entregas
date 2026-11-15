const Pedido = require('../dominio/Pedido');

function aPedido(fila) {
    return new Pedido({
        id: fila.id,
        comercioId: fila.comercio_id,
        nombreCliente: fila.cliente_nombre,
        contactoCliente: fila.cliente_contacto,
        direccionDestino: fila.direccion_destino,
        latitudDestino: fila.latitud_destino,
        longitudDestino: fila.longitud_destino,
        token: fila.token,
        estado: fila.estado,
    });
}

class PedidoRepositorio {
    constructor(db) {
        this.db = db;
    }

    async crear(pedido) {
        const resultado = await this.db.query(
            `INSERT INTO pedidos (comercio_id, cliente_nombre, cliente_contacto, direccion_destino,
                                  latitud_destino, longitud_destino, estado, token)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [
                pedido.comercioId,
                pedido.nombreCliente,
                pedido.contactoCliente,
                pedido.direccionDestino,
                pedido.latitudDestino,
                pedido.longitudDestino,
                pedido.estado,
                pedido.token,
            ]
        );
        pedido.id = resultado.rows[0].id;

        for (const item of pedido.items) {
            await this.db.query(
                'INSERT INTO pedido_items (pedido_id, producto_id, cantidad) VALUES ($1, $2, $3)',
                [pedido.id, item.producto.id, item.cantidad]
            );
        }
        return pedido;
    }

    async buscarPorToken(token) {
        const resultado = await this.db.query('SELECT * FROM pedidos WHERE token = $1', [token]);
        if (resultado.rows.length === 0) {
            return null;
        }
        return aPedido(resultado.rows[0]);
    }
    
    async listarPorComercio(comercioId) {
        const resultado = await this.db.query(
            'SELECT * FROM pedidos WHERE comercio_id = $1 ORDER BY id',
            [comercioId]
        );
        return resultado.rows.map(aPedido);
    }

    async buscarSeguimiento(token) {
        const resultado = await this.db.query(
            `SELECT p.id, p.estado, p.direccion_destino, p.latitud_destino, p.longitud_destino,
                    pos.latitud AS posicion_latitud, pos.longitud AS posicion_longitud, pos.registrado_en
             FROM pedidos p
             LEFT JOIN ruta_pedidos rp ON rp.pedido_id = p.id
             LEFT JOIN LATERAL (
                 SELECT latitud, longitud, registrado_en FROM posiciones
                 WHERE ruta_id = rp.ruta_id AND p.estado = 'retirado'
                 ORDER BY id DESC LIMIT 1
             ) pos ON TRUE
             WHERE p.token = $1`,
            [token]
        );
        if (resultado.rows.length === 0) {
            return null;
        }
        const fila = resultado.rows[0];
        return {
            pedidoId: fila.id,
            estado: fila.estado,
            direccionDestino: fila.direccion_destino,
            latitudDestino: fila.latitud_destino,
            longitudDestino: fila.longitud_destino,
            posicion:
                fila.posicion_latitud === null
                    ? null
                    : {
                          latitud: fila.posicion_latitud,
                          longitud: fila.posicion_longitud,
                          registradoEn: fila.registrado_en,
                      },
        };
    }

    async buscarPendientesParaActualizar(comercioId) {
        const resultado = await this.db.query(
            "SELECT * FROM pedidos WHERE comercio_id = $1 AND estado = 'pendiente' ORDER BY id FOR UPDATE",
            [comercioId]
        );
        return resultado.rows.map(aPedido);
    }
    
    async buscarVariosParaActualizar(ids) {
        const resultado = await this.db.query('SELECT * FROM pedidos WHERE id = ANY($1) ORDER BY id FOR UPDATE', [ids]);
        return resultado.rows.map(aPedido);
    }

    async actualizarEstado(pedido) {
        await this.db.query('UPDATE pedidos SET estado = $1 WHERE id = $2', [pedido.obtenerEstado(), pedido.id]);
    }
}

module.exports = PedidoRepositorio;
