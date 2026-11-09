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
}

module.exports = PedidoRepositorio;
