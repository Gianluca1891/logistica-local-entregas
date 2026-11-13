const request = require('supertest');
const crearApp = require('../../../src/api/app');

describe('Front', () => {
    test('sirve la pagina de inicio en /', async () => {
        const respuesta = await request(crearApp()).get('/');

        expect(respuesta.status).toBe(200);
        expect(respuesta.headers['content-type']).toMatch(/html/);
        expect(respuesta.text).toContain('Iniciar sesión');
    });
});
