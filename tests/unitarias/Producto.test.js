const Producto = require('../../src/dominio/Producto');

/*tests para verificar stock*/
describe('Producto', () => {
    describe('hay Stock?', () => {
        test('Va a devolver true si el stock es suficiente', () => {
            const producto = new Producto({ id: 1, nombre: 'Yerba', stock: 10 });
            expect(producto.hayStock(3)).toBe(true);
        });

        test('Devuelve true si el stock es exacto', () => {
            const producto = new Producto({ id: 1, nombre: 'Yerba', stock: 10 });
            expect(producto.hayStock(10)).toBe(true);
        });

        test('Devuelve false si el stock es insuficiente', () => {
            const producto = new Producto({ id: 1, nombre: 'Yerba', stock: 10 });
            expect(producto.hayStock(11)).toBe(false);
        });
    });

    describe('descontar', ()=> {
        test('Resta la cantidad al stock', () => {
            const producto = new Producto({ id: 1, nombre: 'Yerba', stock: 10 });
            producto.descontar(3);
            expect(producto.stock).toBe(7);
        });

        test('Lanza unerror si no hay stock suficiente y no modifica el stock', () => {
            const producto = new Producto({ id: 1, nombre: 'Yerba', stock: 2 });
            expect(() => producto.descontar(5)).toThrow('Stock insuficiente');
            expect(producto.stock).toBe(2);
        });

        test.each([0, -1, 1.5])('lanza error si la cantidad es %p', (cantidad) => {
            const producto = new Producto({ id: 1, nombre: 'Yerba', stock: 10 });
            expect(() => producto.descontar(cantidad)).toThrow('Cantidad invalida');
        });
    });
});