class AplicarOrdenDeRuta {
    constructor({ unidadDeTrabajo }) {
        this.unidadDeTrabajo = unidadDeTrabajo;
    }

    async ejecutar({ rutaId, orden }) {
        return this.unidadDeTrabajo.ejecutar(async ({ rutas }) => {
            const ruta = await rutas.buscarParaActualizar(rutaId);
            if (!ruta) {
                throw new Error('Ruta inexistente');
            }
            if (ruta.estado !== 'pendiente') {
                return ruta;
            }
            ruta.aplicarOrden(orden);
            await rutas.guardarOrden(ruta);
            return ruta;
        });
    }
}

module.exports = AplicarOrdenDeRuta;
