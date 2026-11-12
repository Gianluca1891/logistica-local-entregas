const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const crearAutenticacion = require('../../../src/api/autenticacion');

const SECRETO = 'secreto-de-test';

function crearAppDePrueba() {
    const requiereRol = crearAutenticacion(SECRETO);
    const app = express();
    app.get('/privado', requiereRol('comercio'), (req, res) => {
        res.json({ comercioId: req.usuario.comercioId });
    });
    return app;
}

function tokenDe(datos, secreto = SECRETO) {
    return jwt.sign(datos, secreto, { expiresIn: '8h' });
}

describe('requiereRol', () => {
    test('deja pasar con un token valido del rol pedido', async () => {
        const token = tokenDe({ usuarioId: 1, rol: 'comercio', comercioId: 5 });

        const respuesta = await request(crearAppDePrueba())
            .get('/privado')
            .set('Authorization', `Bearer ${token}`);

        expect(respuesta.status).toBe(200);
        expect(respuesta.body).toEqual({ comercioId: 5 });
    });

    test('responde 401 si no se envia token', async () => {
        const respuesta = await request(crearAppDePrueba()).get('/privado');

        expect(respuesta.status).toBe(401);
        expect(respuesta.body).toEqual({ error: 'Token invalido' });
    });

    test('responde 401 si el token esta firmado con otro secreto', async () => {
        const token = tokenDe({ usuarioId: 1, rol: 'comercio' }, 'otro-secreto');

        const respuesta = await request(crearAppDePrueba())
            .get('/privado')
            .set('Authorization', `Bearer ${token}`);

        expect(respuesta.status).toBe(401);
    });

    test('responde 401 si el token esta vencido', async () => {
        const vencido = Math.floor(Date.now() / 1000) - 60;
        const token = jwt.sign({ usuarioId: 1, rol: 'comercio', exp: vencido }, SECRETO);

        const respuesta = await request(crearAppDePrueba())
            .get('/privado')
            .set('Authorization', `Bearer ${token}`);

        expect(respuesta.status).toBe(401);
    });

    test('responde 403 si el rol no corresponde', async () => {
        const token = tokenDe({ usuarioId: 3, rol: 'repartidor', repartidorId: 1 });

        const respuesta = await request(crearAppDePrueba())
            .get('/privado')
            .set('Authorization', `Bearer ${token}`);

        expect(respuesta.status).toBe(403);
        expect(respuesta.body).toEqual({ error: 'Acceso denegado' });
    });
});
