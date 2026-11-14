const SolicitarRuta = require('../../src/aplicacion/SolicitarRuta');
const Pedido = require('../../src/dominio/Pedido');
const Repartidor = require('../../src/dominio/Repartidor');

function crearPedido(id, latitud, longitud) {
    return new Pedido({
        id,
        comercioId: 1,
        nombreCliente: 'Ana',
        contactoCliente: '1122334455',
        direccionDestino: 'Calle 1',
        latitudDestino: latitud,
        longitudDestino: longitud,
        token: `token-${id}`,
    });
}

function crearDobles({ pendientes, repartidor, colaFalla = false }) {
    const dobles = { estadosGuardados: [], repartidoresGuardados: [], rutasGuardadas: [], encolados: [] };
    const repositorios = {
        pedidos: {
            buscarPendientesParaActualizar: async () => pendientes,
            actualizarEstado: async (pedido) => dobles.estadosGuardados.push([pedido.id, pedido.obtenerEstado()]),
        },
        repartidores: {
            buscarDisponibleParaActualizar: async () => repartidor,
            actualizar: async (r) => dobles.repartidoresGuardados.push([r.id, r.estaDisponible()]),
        },
        rutas: {
            crear: async (ruta) => {
                ruta.id = 50;
                dobles.rutasGuardadas.push(ruta);
                return ruta;
            },
        },
        comercios: {
            buscarUbicacion: async () => ({ latitud: -34.58, longitud: -58.41 }),
        },
    };
    dobles.unidadDeTrabajo = { ejecutar: (trabajo) => trabajo(repositorios) };
    dobles.colaRutas = {
        add: async (nombre, datos) => {
            if (colaFalla) {
                throw new Error('ECONNREFUSED');
            }
            dobles.encolados.push(datos);
        },
    };
    return dobles;
}

describe('SolicitarRuta', () => {
    test('asigna los pedidos a un repartidor, crea la ruta y encola el calculo', async () => {
        const dobles = crearDobles({
            pendientes: [crearPedido(1, -34.6, -58.4), crearPedido(2, -34.59, -58.42)],
            repartidor: new Repartidor({ id: 7, nombre: 'Juan' }),
        });
        const servicio = new SolicitarRuta({ ...dobles, generarId: () => 'solicitud-1' });

        const ruta = await servicio.ejecutar(1);

        expect(ruta.id).toBe(50);
        expect(ruta.repartidorId).toBe(7);
        expect(ruta.estado).toBe('pendiente');
        expect(ruta.solicitudId).toBe('solicitud-1');
        expect(ruta.rutaPedidos.map((rp) => rp.pedidoId)).toEqual([1, 2]);
        expect(dobles.repartidoresGuardados).toEqual([[7, false]]);
        expect(dobles.estadosGuardados).toEqual([
            [1, 'asignado'],
            [2, 'asignado'],
        ]);
        expect(dobles.encolados).toEqual([
            {
                rutaId: 50,
                origen: { latitud: -34.58, longitud: -58.41 },
                paradas: [
                    { id: 1, latitud: -34.6, longitud: -58.4 },
                    { id: 2, latitud: -34.59, longitud: -58.42 },
                ],
            },
        ]);
    });

    test('rechaza si el comercio no tiene pedidos pendientes', async () => {
        const dobles = crearDobles({ pendientes: [], repartidor: new Repartidor({ id: 7, nombre: 'Juan' }) });
        const servicio = new SolicitarRuta(dobles);

        await expect(servicio.ejecutar(1)).rejects.toThrow('No hay pedidos pendientes');
        expect(dobles.encolados).toHaveLength(0);
    });

    test('rechaza si no hay repartidores disponibles y no modifica los pedidos', async () => {
        const dobles = crearDobles({ pendientes: [crearPedido(1, -34.6, -58.4)], repartidor: null });
        const servicio = new SolicitarRuta(dobles);

        await expect(servicio.ejecutar(1)).rejects.toThrow('No hay repartidores disponibles');
        expect(dobles.estadosGuardados).toHaveLength(0);
        expect(dobles.encolados).toHaveLength(0);
    });

    test('si no se puede encolar avisa que el servicio de rutas no esta disponible', async () => {
        const dobles = crearDobles({
            pendientes: [crearPedido(1, -34.6, -58.4)],
            repartidor: new Repartidor({ id: 7, nombre: 'Juan' }),
            colaFalla: true,
        });
        const servicio = new SolicitarRuta(dobles);

        await expect(servicio.ejecutar(1)).rejects.toThrow('Servicio de rutas no disponible');
    });
});
