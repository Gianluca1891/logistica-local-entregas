const request = require('supertest');
const jwt = require('jsonwebtoken');
const crearApp = require('../../../src/api/app');
const Pedido = require('../../../src/dominio/Pedido');

const SECRETO = 'secreto-de-test';

const pedidoDelComercio = new Pedido({
    id: 7,
    comercioId: 1,
    nombreCliente: 'Ana',
    contactoCliente: '1122334455',
    direccionDestino: 'Av. Siempre Viva 742',
    latitudDestino: -34.6,
    longitudDestino: -58.4,
    token: 'abc',
});

function crearPedidosFalso() {
    const pedidosFalso = {
        pedidoPara: null,
        listarPorComercio: async (comercioId) => {
            pedidosFalso.pedidoPara = comercioId;
            return [pedidoDelComercio];
        },
    };
    return pedidosFalso;
}

function tokenDe(datos) {
    return jwt.sign(datos, SECRETO, { expiresIn: '8h' });
}

describe('GET /comercio/pedidos', () => {
    test('devuelve los pedidos del comercio que viene en el token', async () => {
        const pedidos = crearPedidosFalso();
        const app = crearApp({ pedidos, secreto: SECRETO });
        const token = tokenDe({ usuarioId: 1, rol: 'comercio', comercioId: 1 });

        const respuesta = await request(app)
            .get('/comercio/pedidos')
            .set('Authorization', `Bearer ${token}`);

        expect(respuesta.status).toBe(200);
        expect(respuesta.body).toEqual([
            {
                id: 7,
                estado: 'pendiente',
                nombreCliente: 'Ana',
                contactoCliente: '1122334455',
                direccionDestino: 'Av. Siempre Viva 742',
                latitudDestino: -34.6,
                longitudDestino: -58.4,
            },
        ]);
        expect(pedidos.pedidoPara).toBe(1);
    });

    test('responde 401 sin token y no consulta los pedidos', async () => {
        const pedidos = crearPedidosFalso();
        const app = crearApp({ pedidos, secreto: SECRETO });

        const respuesta = await request(app).get('/comercio/pedidos');

        expect(respuesta.status).toBe(401);
        expect(pedidos.pedidoPara).toBeNull();
    });

    test('responde 403 si entra un repartidor', async () => {
        const pedidos = crearPedidosFalso();
        const app = crearApp({ pedidos, secreto: SECRETO });
        const token = tokenDe({ usuarioId: 3, rol: 'repartidor', repartidorId: 1 });

        const respuesta = await request(app)
            .get('/comercio/pedidos')
            .set('Authorization', `Bearer ${token}`);

        expect(respuesta.status).toBe(403);
        expect(pedidos.pedidoPara).toBeNull();
    });
});
