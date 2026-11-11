const request = require('supertest');
const crearApp = require('../../../src/api/app');
const Pedido = require('../../../src/dominio/Pedido');

const pedidoGuardado = new Pedido({
    id: 7,
    comercioId: 1,
    nombreCliente: 'Ana',
    contactoCliente: '1122334455',
    direccionDestino: 'Av. Siempre Viva 742',
    latitudDestino: -34.6,
    longitudDestino: -58.4,
    token: 'abc',
    estado: 'asignado',
});

const pedidosFalso = {
    buscarPorToken: async (token) => (token === 'abc' ? pedidoGuardado : null),
};

describe('GET /pedidos/:token', () => {
    test('devuelve el estado y el destino del pedido', async () => {
        const app = crearApp({ pedidos: pedidosFalso });

        const respuesta = await request(app).get('/pedidos/abc');

        expect(respuesta.status).toBe(200);
        expect(respuesta.body).toEqual({
            id: 7,
            estado: 'asignado',
            direccionDestino: 'Av. Siempre Viva 742',
            latitudDestino: -34.6,
            longitudDestino: -58.4,
        });
    });

    test('responde 404 si el token no existe', async () => {
        const app = crearApp({ pedidos: pedidosFalso });

        const respuesta = await request(app).get('/pedidos/inventado');

        expect(respuesta.status).toBe(404);
        expect(respuesta.body).toEqual({ error: 'Pedido no encontrado' });
    });
});
