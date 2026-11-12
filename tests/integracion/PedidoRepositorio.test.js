const { pool, limpiarBase, crearComercio } = require('./baseDeDatos');
const PedidoRepositorio = require('../../src/infraestructura/PedidoRepositorio');

const pedidos = new PedidoRepositorio(pool);

async function crearPedido(comercioId, token) {
    await pool.query(
        `INSERT INTO pedidos (comercio_id, cliente_nombre, cliente_contacto, direccion_destino,
                              latitud_destino, longitud_destino, token)
         VALUES ($1, 'Ana', '1122334455', 'Calle 1', -34.6, -58.4, $2)`,
        [comercioId, token]
    );
}

beforeEach(() => limpiarBase());

afterAll(() => pool.end());

describe('PedidoRepositorio', () => {
    test('listarPorComercio devuelve solo los pedidos de ese comercio', async () => {
        const almacen = await crearComercio('Almacen');
        const kiosco = await crearComercio('Kiosco');
        await crearPedido(almacen, 'token-1');
        await crearPedido(kiosco, 'token-2');
        await crearPedido(almacen, 'token-3');

        const lista = await pedidos.listarPorComercio(almacen);

        expect(lista.map((pedido) => pedido.token)).toEqual(['token-1', 'token-3']);
        expect(lista[0].obtenerEstado()).toBe('pendiente');
    });

    test('listarPorComercio devuelve una lista vacia si no tiene pedidos', async () => {
        const almacen = await crearComercio('Almacen');

        expect(await pedidos.listarPorComercio(almacen)).toEqual([]);
    });
});
