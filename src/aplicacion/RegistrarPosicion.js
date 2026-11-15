const Posicion = require('../dominio/Posicion');

class RegistrarPosicion {
    constructor({ unidadDeTrabajo }) {
        this.unidadDeTrabajo = unidadDeTrabajo;
    }

    async ejecutar({ repartidorId, latitud, longitud }) {
        const posicion = new Posicion({ latitud, longitud });
        return this.unidadDeTrabajo.ejecutar(async ({ rutas, posiciones }) => {
            const ruta = await rutas.buscarActivaParaActualizar(repartidorId);
            if (!ruta) {
                throw new Error('No tenes una ruta asignada');
            }
            if (ruta.estado !== 'en_curso') {
                throw new Error('La ruta no esta en curso');
            }
            posicion.rutaId = ruta.id;
            await posiciones.registrar(posicion);
            return { ruta, posicion };
        });
    }
}

module.exports = RegistrarPosicion;
