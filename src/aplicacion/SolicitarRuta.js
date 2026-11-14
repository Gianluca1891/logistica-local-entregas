const { randomUUID } = require('crypto');
const Ruta = require('../dominio/Ruta');
const RutaPedido = require('../dominio/RutaPedido');

class SolicitarRuta {
    constructor({ unidadDeTrabajo, colaRutas, generarId = randomUUID }) {
        this.unidadDeTrabajo = unidadDeTrabajo;
        this.colaRutas = colaRutas;
        this.generarId = generarId;
    }

    async ejecutar(comercioId) {
        return this.unidadDeTrabajo.ejecutar(async ({ pedidos, repartidores, rutas, comercios }) => {
            const pendientes = await pedidos.buscarPendientesParaActualizar(comercioId);
            if (pendientes.length === 0) {
                throw new Error('No hay pedidos pendientes');
            }

            const repartidor = await repartidores.buscarDisponibleParaActualizar();
            if (!repartidor) {
                throw new Error('No hay repartidores disponibles');
            }
            repartidor.ocupar();
            await repartidores.actualizar(repartidor);

            for (const pedido of pendientes) {
                pedido.marcarAsignado();
                await pedidos.actualizarEstado(pedido);
            }

            const ruta = await rutas.crear(
                new Ruta({
                    comercioId,
                    repartidorId: repartidor.id,
                    solicitudId: this.generarId(),
                    rutaPedidos: pendientes.map((pedido) => new RutaPedido({ pedidoId: pedido.id })),
                })
            );

            const origen = await comercios.buscarUbicacion(comercioId);
            const paradas = pendientes.map((pedido) => ({
                id: pedido.id,
                latitud: pedido.latitudDestino,
                longitud: pedido.longitudDestino,
            }));
            try {
                await this.colaRutas.add('calcular', { rutaId: ruta.id, origen, paradas });
            } catch {
                throw new Error('Servicio de rutas no disponible');
            }
            return ruta;
        });
    }
}

module.exports = SolicitarRuta;
