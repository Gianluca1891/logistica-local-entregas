const IniciarRuta = require('../../src/aplicacion/IniciarRuta');
const EntregarPedido = require('../../src/aplicacion/EntregarPedido');
const Pedido = require('../../src/dominio/Pedido');
const Repartidor = require('../../src/dominio/Repartidor');
const Ruta = require('../../src/dominio/Ruta');
const RutaPedido = require('../../src/dominio/RutaPedido');

function crearPedido(id, estado) {
    return new Pedido({ id, comercioId: 1, token: `token-${id}`, estado });
}

function crearDobles({ ruta, pedidos }) {
    const dobles = { rutasGuardadas: [], pedidosGuardados: [], repartidor: new Repartidor({ id: 2, disponible: false }) };
    const repositorios = {
        rutas: {
            buscarActivaParaActualizar: async () => ruta,
            actualizarEstado: async (r) => dobles.rutasGuardadas.push(r.estado),
        },
        pedidos: {
            buscarVariosParaActualizar: async () => pedidos,
            actualizarEstado: async (p) => dobles.pedidosGuardados.push([p.id, p.obtenerEstado()]),
        },
        repartidores: {
            buscarParaActualizar: async () => dobles.repartidor,
            actualizar: async () => {},
        },
    };
    dobles.unidadDeTrabajo = { ejecutar: (trabajo) => trabajo(repositorios) };
    return dobles;
}

function crearRuta(estado) {
    return new Ruta({
        id: 5,
        comercioId: 1,
        repartidorId: 2,
        solicitudId: 's-1',
        estado,
        rutaPedidos: [new RutaPedido({ pedidoId: 10, orden: 1 }), new RutaPedido({ pedidoId: 20, orden: 2 })],
    });
}

describe('IniciarRuta', () => {
    test('pone la ruta en curso y marca los pedidos como retirados', async () => {
        const dobles = crearDobles({
            ruta: crearRuta('lista'),
            pedidos: [crearPedido(10, 'asignado'), crearPedido(20, 'asignado')],
        });

        const ruta = await new IniciarRuta(dobles).ejecutar(2);

        expect(ruta.estado).toBe('en_curso');
        expect(dobles.pedidosGuardados).toEqual([
            [10, 'retirado'],
            [20, 'retirado'],
        ]);
    });

    test('rechaza si el repartidor no tiene ruta', async () => {
        const dobles = crearDobles({ ruta: null, pedidos: [] });

        await expect(new IniciarRuta(dobles).ejecutar(2)).rejects.toThrow('No tenes una ruta asignada');
    });

    test('rechaza iniciar una ruta que todavia se esta calculando', async () => {
        const dobles = crearDobles({ ruta: crearRuta('pendiente'), pedidos: [] });

        await expect(new IniciarRuta(dobles).ejecutar(2)).rejects.toThrow('Transicion invalida');
    });
});

describe('EntregarPedido', () => {
    test('entrega un pedido y la ruta sigue en curso si faltan otros', async () => {
        const dobles = crearDobles({
            ruta: crearRuta('en_curso'),
            pedidos: [crearPedido(10, 'retirado'), crearPedido(20, 'retirado')],
        });

        const resultado = await new EntregarPedido(dobles).ejecutar({ repartidorId: 2, pedidoId: 10 });

        expect(resultado.rutaFinalizada).toBe(false);
        expect(dobles.pedidosGuardados).toEqual([[10, 'entregado']]);
        expect(dobles.repartidor.estaDisponible()).toBe(false);
    });

    test('al entregar el ultimo pedido finaliza la ruta y libera al repartidor', async () => {
        const dobles = crearDobles({
            ruta: crearRuta('en_curso'),
            pedidos: [crearPedido(10, 'entregado'), crearPedido(20, 'retirado')],
        });

        const resultado = await new EntregarPedido(dobles).ejecutar({ repartidorId: 2, pedidoId: 20 });

        expect(resultado.rutaFinalizada).toBe(true);
        expect(dobles.rutasGuardadas).toEqual(['finalizada']);
        expect(dobles.repartidor.estaDisponible()).toBe(true);
    });

    test('rechaza un pedido que no es de su ruta', async () => {
        const dobles = crearDobles({ ruta: crearRuta('en_curso'), pedidos: [] });

        await expect(new EntregarPedido(dobles).ejecutar({ repartidorId: 2, pedidoId: 99 })).rejects.toThrow(
            'Pedido no encontrado'
        );
    });

    test('rechaza entregar si la ruta no esta en curso', async () => {
        const dobles = crearDobles({ ruta: crearRuta('lista'), pedidos: [] });

        await expect(new EntregarPedido(dobles).ejecutar({ repartidorId: 2, pedidoId: 10 })).rejects.toThrow(
            'Transicion invalida'
        );
    });
});
