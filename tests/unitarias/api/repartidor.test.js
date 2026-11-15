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

    test('POST /repartidor/pedidos/:id/entregar entrega el pedido y avisa por WebSocket', async () => {
        const recibidos = [];
        const entregarPedido = {
            ejecutar: async (datos) => {
                recibidos.push(datos);
                return { pedido: { id: 10, obtenerEstado: () => 'entregado' }, rutaFinalizada: true };
            },
        };
        const publicados = [];
        const tiempoReal = { publicar: (pedidoIds, mensaje) => publicados.push([pedidoIds, mensaje]) };
        const app = crearApp({ entregarPedido, tiempoReal, secreto: SECRETO });

        const respuesta = await request(app)
            .post('/repartidor/pedidos/10/entregar')
            .set('Authorization', `Bearer ${tokenJuan}`);

        expect(respuesta.status).toBe(200);
        expect(respuesta.body).toEqual({ id: 10, estado: 'entregado', rutaFinalizada: true });
        expect(recibidos).toEqual([{ repartidorId: 1, pedidoId: 10 }]);
        expect(publicados).toEqual([[[10], { tipo: 'estado', estado: 'entregado' }]]);
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
        test('POST /repartidor/posicion guarda la posicion y la avisa a los pedidos de la ruta', async () => {
        const registrarPosicion = {
            ejecutar: async (datos) => ({
                ruta: { rutaPedidos: [{ pedidoId: 10 }, { pedidoId: 20 }] },
                posicion: { latitud: datos.latitud, longitud: datos.longitud, registradoEn: '2026-11-16T12:00:00.000Z' },
            }),
        };
        const publicados = [];
        const tiempoReal = { publicar: (pedidoIds, mensaje) => publicados.push([pedidoIds, mensaje]) };
        const app = crearApp({ registrarPosicion, tiempoReal, secreto: SECRETO });

        const respuesta = await request(app)
            .post('/repartidor/posicion')
            .set('Authorization', `Bearer ${tokenJuan}`)
            .send({ latitud: -34.6, longitud: -58.4 });

        expect(respuesta.status).toBe(201);
        expect(respuesta.body).toEqual({ latitud: -34.6, longitud: -58.4 });
        expect(publicados).toEqual([
            [[10, 20], { tipo: 'posicion', latitud: -34.6, longitud: -58.4, registradoEn: '2026-11-16T12:00:00.000Z' }],
        ]);
    });

    test('responde 400 si las coordenadas vienen vacias', async () => {
        const RegistrarPosicion = require('../../../src/aplicacion/RegistrarPosicion');
        const registrarPosicion = new RegistrarPosicion({ unidadDeTrabajo: {} });
        const app = crearApp({ registrarPosicion, secreto: SECRETO });

        const respuesta = await request(app)
            .post('/repartidor/posicion')
            .set('Authorization', `Bearer ${tokenJuan}`)
            .send({ latitud: '', longitud: null });

        expect(respuesta.status).toBe(400);
        expect(respuesta.body).toEqual({ error: 'Coordenadas invalidas' });
    });
});
