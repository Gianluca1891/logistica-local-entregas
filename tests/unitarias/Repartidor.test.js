const Repartidor = require('../../src/dominio/Repartidor');

describe('Repartidor', () => {
    test('nace disponible', () => {
        const repartidor = new Repartidor({ id: 1, nombre: 'Juan' });
        expect(repartidor.estaDisponible()).toBe(true);
    });

    test('al ocuparse deja de estar disponible', () => {
        const repartidor = new Repartidor({ id: 1, nombre: 'Juan' });
        repartidor.ocupar();
        expect(repartidor.estaDisponible()).toBe(false);
    });

    test('no puede ocuparse si ya tiene una ruta activa', () => {
        const repartidor = new Repartidor({ id: 1, nombre: 'Juan' });
        repartidor.ocupar();
        expect(() => repartidor.ocupar()).toThrow('Repartidor no disponible');
    });

    test('al liberarse vuelve a estar disponible', () => {
        const repartidor = new Repartidor({ id: 1, nombre: 'Juan' });
        repartidor.ocupar();
        repartidor.liberar();
        expect(repartidor.estaDisponible()).toBe(true);
    });
});