const AplicarOrdenDeRuta = require('../../src/aplicacion/AplicarOrdenDeRuta');
const Ruta = require('../../src/dominio/Ruta');
const RutaPedido = require('../../src/dominio/RutaPedido');

function crearRuta(estado = 'pendiente') {
    return new Ruta({
        id: 5,
        comercioId: 1,
        repartidorId: 2,
        solicitudId: 'solicitud-1',
        estado,
        rutaPedidos: [new RutaPedido({ pedidoId: 10 }), new RutaPedido({ pedidoId: 20 })],
    });
}

function crearDobles(ruta) {
    const dobles = { guardadas: [] };
    const repositorios = {
        rutas: {
            buscarParaActualizar: async () => ruta,
            guardarOrden: async (r) => dobles.guardadas.push(r),
        },
    };
    dobles.unidadDeTrabajo = { ejecutar: (trabajo) => trabajo(repositorios) };
    return dobles;
}

describe('AplicarOrdenDeRuta', () => {
    test('guarda el orden calculado y deja la ruta lista', async () => {
        const ruta = crearRuta();
        const dobles = crearDobles(ruta);
        const servicio = new AplicarOrdenDeRuta(dobles);

        await servicio.ejecutar({ rutaId: 5, orden: [20, 10] });

        expect(ruta.estado).toBe('lista');
        expect(ruta.rutaPedidos.map((rp) => [rp.pedidoId, rp.orden])).toEqual([
            [10, 2],
            [20, 1],
        ]);
        expect(dobles.guardadas).toEqual([ruta]);
    });

    test('si la ruta ya no esta pendiente no hace nada (resultado repetido)', async () => {
        const dobles = crearDobles(crearRuta('lista'));
        const servicio = new AplicarOrdenDeRuta(dobles);

        await servicio.ejecutar({ rutaId: 5, orden: [20, 10] });

        expect(dobles.guardadas).toHaveLength(0);
    });

    test('rechaza un orden que no tiene todos los pedidos de la ruta', async () => {
        const dobles = crearDobles(crearRuta());
        const servicio = new AplicarOrdenDeRuta(dobles);

        await expect(servicio.ejecutar({ rutaId: 5, orden: [20] })).rejects.toThrow('Orden incompleto');
        expect(dobles.guardadas).toHaveLength(0);
    });

    test('rechaza una ruta que no existe', async () => {
        const servicio = new AplicarOrdenDeRuta(crearDobles(null));

        await expect(servicio.ejecutar({ rutaId: 99, orden: [1] })).rejects.toThrow('Ruta inexistente');
    });
});
