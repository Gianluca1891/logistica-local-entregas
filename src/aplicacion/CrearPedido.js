const { randomUUID } = require('crypto');
const Pedido = require('../dominio/Pedido');
const PedidoItem = require('../dominio/PedidoItem');

class CrearPedido {
    constructor({ unidadDeTrabajo, generarToken = randomUUID }) {
        this.unidadDeTrabajo = unidadDeTrabajo;
        this.generarToken = generarToken;
    }

    async ejecutar(datos) {
        if (!datos.items || datos.items.length === 0) {
            throw new Error('El pedido debe tener al menos un producto');
        }

        return this.unidadDeTrabajo.ejecutar(async ({ productos, pedidos }) => {
            const ids = datos.items.map((item) => item.productoId);
            const encontrados = await productos.buscarParaActualizar(ids);

            const items = datos.items.map(({ productoId, cantidad }) => {
                const producto = encontrados.find((p) => p.id === productoId);
                if (!producto) {
                    throw new Error('Producto inexistente');
                }
                if (producto.comercioId !== datos.comercioId) {
                    throw new Error('Todos los productos deben ser del mismo comercio');
                }
                return new PedidoItem({ producto, cantidad });
            });

            items.forEach((item) => item.validar());

            for (const item of items) {
                item.producto.descontar(item.cantidad);
                await productos.actualizarStock(item.producto);
            }

            const pedido = new Pedido({
                comercioId: datos.comercioId,
                nombreCliente: datos.nombreCliente,
                contactoCliente: datos.contactoCliente,
                direccionDestino: datos.direccionDestino,
                latitudDestino: datos.latitudDestino,
                longitudDestino: datos.longitudDestino,
                token: this.generarToken(),
                items,
            });
            return pedidos.crear(pedido);
        });
    }
}

module.exports = CrearPedido;
