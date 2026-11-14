class IniciarRuta {
    constructor({ unidadDeTrabajo }) {
        this.unidadDeTrabajo = unidadDeTrabajo;
    }

    async ejecutar(repartidorId) {
        return this.unidadDeTrabajo.ejecutar(async ({ rutas, pedidos }) => {
            const ruta = await rutas.buscarActivaParaActualizar(repartidorId);
            if (!ruta) {
                throw new Error('No tenes una ruta asignada');
            }
            ruta.iniciar();
            await rutas.actualizarEstado(ruta);

            const pedidosDeLaRuta = await pedidos.buscarVariosParaActualizar(ruta.rutaPedidos.map((rp) => rp.pedidoId));
            for (const pedido of pedidosDeLaRuta) {
                pedido.marcarRetirado();
                await pedidos.actualizarEstado(pedido);
            }
            return ruta;
        });
    }
}

module.exports = IniciarRuta;
