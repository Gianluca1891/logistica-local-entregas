const Ruta = require('../../src/dominio/Ruta');
const RutaPedido = require('../../src/dominio/RutaPedido');

function crearRuta() {
    return new Ruta({
        id: 1,
        comercioId: 1,
        repartidorId: 1,
        solicitudId: 'sol-1',
        rutaPedidos: [
            new RutaPedido({ pedidoId: 10 }),
            new RutaPedido({ pedidoId: 20 }),
            new RutaPedido({ pedidoId: 30 }),
        ],
    });
}

describe('Ruta', () => {
    test('no puede crearse sin pedidos', () => {
        expect(() => new Ruta({ id: 1, rutaPedidos: [] })).toThrow('La ruta debe tener al menos un pedido');
    });

    test('nace pendiente', () => {
        expect(crearRuta().estado).toBe('pendiente');
    });

    test('aplicarOrden asigna el orden recibido y queda lista', () => {
        const ruta = crearRuta();
        ruta.aplicarOrden([30, 10, 20]);

        const ordenDe = (pedidoId) => ruta.rutaPedidos.find((rp) => rp.pedidoId === pedidoId).orden;
        expect(ordenDe(30)).toBe(1);
        expect(ordenDe(10)).toBe(2);
        expect(ordenDe(20)).toBe(3);
        expect(ruta.estado).toBe('lista');
    });

    test.each([
        ['falta un pedido', [30, 10]],
        ['un pedido repetido', [30, 10, 10]],
        ['un pedido ajeno', [30, 10, 99]],
    ])('aplicarOrden rechaza una lista con %s', (_, pedidoIds) => {
        const ruta = crearRuta();
        expect(() => ruta.aplicarOrden(pedidoIds)).toThrow('Orden incompleto');
        expect(ruta.estado).toBe('pendiente');
        expect(ruta.rutaPedidos.every((rp) => rp.orden === null)).toBe(true);
    });

    test('no puede iniciarse sin orden calculado', () => {
        expect(() => crearRuta().iniciar()).toThrow('Transicion invalida');
    });

    test('no puede aplicarse el orden dos veces', () => {
        const ruta = crearRuta();
        ruta.aplicarOrden([10, 20, 30]);
        expect(() => ruta.aplicarOrden([30, 20, 10])).toThrow('Transicion invalida');
    });

    test('recorre todo su ciclo de vida', () => {
        const ruta = crearRuta();
        ruta.aplicarOrden([10, 20, 30]);
        ruta.iniciar();
        expect(ruta.estado).toBe('en_curso');
        ruta.finalizar();
        expect(ruta.estado).toBe('finalizada');
    });
});
