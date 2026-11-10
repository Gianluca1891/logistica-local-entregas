const request = require('supertest');
const crearApp = require('../../../src/api/app');
const Pedido = require('../../../src/dominio/Pedido');

function crearPedidoFalso(comportamiento) {
    const recibidos = [];
    const crearPedido = {
        ejecutar: async (datos) => {
            recibidos.push(datos);
            return comportamiento(datos);
        },
    };
    return { crearPedido, recibidos };
}

const cuerpoValido = {
    comercioId: '1',
    nombreCliente: 'Ana',
    contactoCliente: '1122334455',
    direccionDestino: 'Av. Siempre Viva 742',
    latitudDestino: -34.6,
    longitudDestino: -58.4,
    items: [{ productoId: '10', cantidad: 2 }],
};

describe('POST /pedidos', () => {
    test('crea el pedido y responde 201 con el token', async () => {
        const falso = crearPedidoFalso((datos) => new Pedido({ ...datos, id: 7, token: 'abc' }));
        const app = crearApp({ crearPedido: falso.crearPedido });

        const respuesta = await request(app).post('/pedidos').send(cuerpoValido);

        expect(respuesta.status).toBe(201);
        expect(respuesta.body).toEqual({ id: 7, token: 'abc', estado: 'pendiente' });
        expect(falso.recibidos[0].comercioId).toBe(1);
        expect(falso.recibidos[0].items).toEqual([{ productoId: 10, cantidad: 2 }]);
    });

    test('responde 400 si faltan datos del cliente y no llama al servicio', async () => {
        const falso = crearPedidoFalso(() => null);
        const app = crearApp({ crearPedido: falso.crearPedido });

        const respuesta = await request(app)
            .post('/pedidos')
            .send({ ...cuerpoValido, nombreCliente: '' });

        expect(respuesta.status).toBe(400);
        expect(respuesta.body).toEqual({ error: 'Datos invalidos' });
        expect(falso.recibidos).toHaveLength(0);
    });

    test('responde 400 si el JSON esta mal formado', async () => {
        const falso = crearPedidoFalso(() => null);
        const app = crearApp({ crearPedido: falso.crearPedido });

        const respuesta = await request(app)
            .post('/pedidos')
            .set('Content-Type', 'application/json')
            .send('{malformado');

        expect(respuesta.status).toBe(400);
        expect(respuesta.body).toEqual({ error: 'JSON invalido' });
        expect(falso.recibidos).toHaveLength(0);
    });

    test('responde 400 con el mensaje si el servicio rechaza el pedido', async () => {
        const falso = crearPedidoFalso(() => {
            throw new Error('Stock insuficiente');
        });
        const app = crearApp({ crearPedido: falso.crearPedido });

        const respuesta = await request(app).post('/pedidos').send(cuerpoValido);

        expect(respuesta.status).toBe(400);
        expect(respuesta.body).toEqual({ error: 'Stock insuficiente' });
    });

    test('responde 500 sin mostrar el detalle si falla algo inesperado', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const falso = crearPedidoFalso(() => {
            throw new Error('se cayo la base');
        });
        const app = crearApp({ crearPedido: falso.crearPedido });

        const respuesta = await request(app).post('/pedidos').send(cuerpoValido);

        expect(respuesta.status).toBe(500);
        expect(respuesta.body).toEqual({ error: 'Error interno' });
        console.error.mockRestore();
    });
});
