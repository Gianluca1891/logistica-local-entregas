const request = require('supertest');
const jwt = require('jsonwebtoken');
const crearApp = require('../../../src/api/app');

const SECRETO = 'secreto-de-test';
const tokenComercio = jwt.sign({ usuarioId: 1, rol: 'comercio', comercioId: 3 }, SECRETO);

function crearSolicitarRutaFalso(comportamiento) {
    const falso = {
        recibidos: [],
        ejecutar: async (comercioId) => {
            falso.recibidos.push(comercioId);
            return comportamiento();
        },
    };
    return falso;
}

describe('POST /comercio/rutas', () => {
    test('responde 202 con la ruta pendiente del comercio del token', async () => {
        const solicitarRuta = crearSolicitarRutaFalso(() => ({ id: 9, estado: 'pendiente', repartidorId: 2 }));
        const app = crearApp({ solicitarRuta, secreto: SECRETO });

        const respuesta = await request(app)
            .post('/comercio/rutas')
            .set('Authorization', `Bearer ${tokenComercio}`);

        expect(respuesta.status).toBe(202);
        expect(respuesta.body).toEqual({ id: 9, estado: 'pendiente', repartidorId: 2 });
        expect(solicitarRuta.recibidos).toEqual([3]);
    });

    test('responde 409 si no hay repartidores disponibles', async () => {
        const solicitarRuta = crearSolicitarRutaFalso(() => {
            throw new Error('No hay repartidores disponibles');
        });
        const app = crearApp({ solicitarRuta, secreto: SECRETO });

        const respuesta = await request(app)
            .post('/comercio/rutas')
            .set('Authorization', `Bearer ${tokenComercio}`);

        expect(respuesta.status).toBe(409);
        expect(respuesta.body).toEqual({ error: 'No hay repartidores disponibles' });
    });

    test('responde 503 si el servicio de rutas no esta disponible', async () => {
        const solicitarRuta = crearSolicitarRutaFalso(() => {
            throw new Error('Servicio de rutas no disponible');
        });
        const app = crearApp({ solicitarRuta, secreto: SECRETO });

        const respuesta = await request(app)
            .post('/comercio/rutas')
            .set('Authorization', `Bearer ${tokenComercio}`);

        expect(respuesta.status).toBe(503);
    });
});
