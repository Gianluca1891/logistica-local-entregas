const PedidoItem = require('../../src/dominio/PedidoItem');
const Producto = require('../../src/dominio/Producto');

describe('PedidoItem', () => {
    test('Es valido si la cantidad es correcta y hay stock',()=> {
        const producto = new Producto({ id: 1, nombre: 'Yerba', stock: 10 });
        const item = new PedidoItem({ producto, cantidad: 3 });
        expect(() => item.validar()).not.toThrow();
    });

    test('lanza error si no hay stock suficiente',() =>{
        const producto = new Producto({ id: 1, nombre: 'Yerba', stock: 2 });
        const item = new PedidoItem({ producto, cantidad: 5 });
        expect(() => item.validar()).toThrow('Stock insuficiente');
    });

    test.each([0, -1, 1.5])('lanza error si la cantidad es %p', (cantidad) =>{
        const producto = new Producto({ id: 1, nombre: 'Yerba', stock: 10 });
        const item = new PedidoItem({ producto, cantidad });
        expect(() => item.validar()).toThrow('Cantidad invalida');
    });
});