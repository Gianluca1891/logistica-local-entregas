const request = require('supertest');
const crearApp = require('../../../src/api/app');

const productosFalso = {
    listarConComercio: async () => [
        { id: 1, nombre: 'Yerba', stock: 20, comercioId: 1, comercioNombre: 'Almacen Don Pepe' },
    ],
};

describe('GET /productos', () => {
    test('devuelve los productos con su comercio sin pedir login', async () => {
        const app = crearApp({ productos: productosFalso });

        const respuesta = await request(app).get('/productos');

        expect(respuesta.status).toBe(200);
        expect(respuesta.body).toEqual([
            { id: 1, nombre: 'Yerba', stock: 20, comercioId: 1, comercioNombre: 'Almacen Don Pepe' },
        ]);
    });
});
