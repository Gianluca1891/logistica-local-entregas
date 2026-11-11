const request = require('supertest');
const crearApp = require('../../../src/api/app');

const iniciarSesionFalso = {
    ejecutar: async ({ email, password }) => {
        if (email === 'almacen@demo.com' && password === 'demo1234') {
            return { token: 'token-de-prueba', rol: 'comercio' };
        }
        throw new Error('Credenciales invalidas');
    },
};

const app = crearApp({ iniciarSesion: iniciarSesionFalso });

describe('POST /login', () => {
    test('con usuario y contrasena correctos devuelve el token y el rol', async () => {
        const respuesta = await request(app)
            .post('/login')
            .send({ email: 'almacen@demo.com', password: 'demo1234' });

        expect(respuesta.status).toBe(200);
        expect(respuesta.body).toEqual({ token: 'token-de-prueba', rol: 'comercio' });
    });

    test('con contrasena incorrecta responde 401', async () => {
        const respuesta = await request(app)
            .post('/login')
            .send({ email: 'almacen@demo.com', password: 'otra' });

        expect(respuesta.status).toBe(401);
        expect(respuesta.body).toEqual({ error: 'Credenciales invalidas' });
    });

    test('sin email o contrasena responde 400', async () => {
        const respuesta = await request(app).post('/login').send({ email: 'almacen@demo.com' });

        expect(respuesta.status).toBe(400);
        expect(respuesta.body).toEqual({ error: 'Datos invalidos' });
    });
});
