const request = require('supertest');
const crearApp = require('../../../src/api/app');

describe('GET /salud', () => {
    test('responde 200 con estado ok', async () => {
        const respuesta = await request(crearApp()).get('/salud');

        expect(respuesta.status).toBe(200);
        expect(respuesta.body).toEqual({ estado: 'ok' });
    });

    test('una ruta inexistente responde 404', async () => {
        const respuesta = await request(crearApp()).get('/no-existe');

        expect(respuesta.status).toBe(404);
    });
});
