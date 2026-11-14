class EntregarPedido {
    constructor({ unidadDeTrabajo }) {
        this.unidadDeTrabajo = unidadDeTrabajo;
    }

    async ejecutar({ repartidorId, pedidoId }) {
        return this.unidadDeTrabajo.ejecutar(async ({ rutas, pedidos, repartidores }) => {
            const ruta = await rutas.buscarActivaParaActualizar(repartidorId);
            if (!ruta || !ruta.rutaPedidos.some((rp) => rp.pedidoId === pedidoId)) {
                throw new Error('Pedido no encontrado');
            }
            if (ruta.estado !== 'en_curso') {
                throw new Error('Transicion invalida');
            }

            const pedidosDeLaRuta = await pedidos.buscarVariosParaActualizar(ruta.rutaPedidos.map((rp) => rp.pedidoId));
            const pedido = pedidosDeLaRuta.find((p) => p.id === pedidoId);
            pedido.marcarEntregado();
            await pedidos.actualizarEstado(pedido);

            const terminada = pedidosDeLaRuta.every((p) => p.obtenerEstado() === 'entregado');
            if (terminada) {
                ruta.finalizar();
                await rutas.actualizarEstado(ruta);
                const repartidor = await repartidores.buscarParaActualizar(repartidorId);
                repartidor.liberar();
                await repartidores.actualizar(repartidor);
            }
            return { pedido, rutaFinalizada: terminada };
        });
    }
}

module.exports = EntregarPedido;
