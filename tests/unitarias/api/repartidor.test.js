const request = require('supertest');
const jwt = require('jsonwebtoken');
const crearApp = require('../../../src/api/app');

const SECRETO = 'secreto-de-test';
const tokenJuan = jwt.sign({ usuarioId: 3, rol: 'repartidor', repartidorId: 1 }, SECRETO);
const tokenComercio = jwt.sign({ usuarioId: 1, rol: 'comercio', comercioId: 1 }, SECRETO);

describe('Endpoints del repartidor', () => {
    test('GET /repartidor/ruta devuelve la ruta activa del repartidor del token', async () => {
        const pedidosDe = [];
        const rutas = {
            buscarActivaDeRepartidor: async (repartidorId) => {
                pedidosDe.push(repartidorId);
                return { id: 1, estado: 'lista', paradas: [] };
            },
        };
        const app = crearApp({ rutas, secreto: SECRETO });

        const respuesta = await request(app).get('/repartidor/ruta').set('Authorization', `Bearer ${tokenJuan}`);

        expect(respuesta.status).toBe(200);
        expect(respuesta.body).toEqual({ id: 1, estado: 'lista', paradas: [] });
        expect(pedidosDe).toEqual([1]);
    });

    test('un comercio no puede ver la ruta del repartidor', async () => {
        const app = crearApp({ rutas: {}, secreto: SECRETO });

        const respuesta = await request(app).get('/repartidor/ruta').set('Authorization', `Bearer ${tokenComercio}`);

        expect(respuesta.status).toBe(403);
    });

    test('POST /repartidor/pedidos/:id/entregar entrega el pedido', async () => {
        const recibidos = [];
        const entregarPedido = {
            ejecutar: async (datos) => {
                recibidos.push(datos);
                return { pedido: { id: 10, obtenerEstado: () => 'entregado' }, rutaFinalizada: true };
            },
        };
        const app = crearApp({ entregarPedido, secreto: SECRETO });

        const respuesta = await request(app)
            .post('/repartidor/pedidos/10/entregar')
            .set('Authorization', `Bearer ${tokenJuan}`);

        expect(respuesta.status).toBe(200);
        expect(respuesta.body).toEqual({ id: 10, estado: 'entregado', rutaFinalizada: true });
        expect(recibidos).toEqual([{ repartidorId: 1, pedidoId: 10 }]);
    });

    test('responde 409 si se intenta entregar dos veces', async () => {
        const entregarPedido = {
            ejecutar: async () => {
                throw new Error('Transicion invalida');
            },
        };
        const app = crearApp({ entregarPedido, secreto: SECRETO });

        const respuesta = await request(app)
            .post('/repartidor/pedidos/10/entregar')
            .set('Authorization', `Bearer ${tokenJuan}`);

        expect(respuesta.status).toBe(409);
    });
});
