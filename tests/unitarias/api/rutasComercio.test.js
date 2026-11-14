const request = require('supertest');
const jwt = require('jsonwebtoken');
const crearApp = require('../../../src/api/app');

const SECRETO = 'secreto-de-test';

describe('GET /comercio/rutas', () => {
    test('devuelve las rutas del comercio que viene en el token', async () => {
        const pedidosDe = [];
        const rutas = {
            listarPorComercio: async (comercioId) => {
                pedidosDe.push(comercioId);
                return [{ id: 1, estado: 'lista', repartidor: 'Juan', paradas: [] }];
            },
        };
        const app = crearApp({ rutas, secreto: SECRETO });
        const token = jwt.sign({ usuarioId: 1, rol: 'comercio', comercioId: 4 }, SECRETO);

        const respuesta = await request(app).get('/comercio/rutas').set('Authorization', `Bearer ${token}`);

        expect(respuesta.status).toBe(200);
        expect(respuesta.body).toEqual([{ id: 1, estado: 'lista', repartidor: 'Juan', paradas: [] }]);
        expect(pedidosDe).toEqual([4]);
    });
});
