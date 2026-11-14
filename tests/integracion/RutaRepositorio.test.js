const { pool, limpiarBase, crearComercio, crearRepartidor } = require('./baseDeDatos');
const RutaRepositorio = require('../../src/infraestructura/RutaRepositorio');

const rutas = new RutaRepositorio(pool);

async function crearPedido(comercioId, nombre) {
    const resultado = await pool.query(
        `INSERT INTO pedidos (comercio_id, cliente_nombre, cliente_contacto, direccion_destino,
                              latitud_destino, longitud_destino, estado, token)
         VALUES ($1, $2, '1122334455', 'Calle 1', -34.6, -58.4, 'asignado', $2)
         RETURNING id`,
        [comercioId, nombre]
    );
    return resultado.rows[0].id;
}

async function crearRuta(comercioId, repartidorId, pedidosConOrden) {
    const resultado = await pool.query(
        "INSERT INTO rutas (comercio_id, repartidor_id, solicitud_id, estado) VALUES ($1, $2, $3, 'lista') RETURNING id",
        [comercioId, repartidorId, `solicitud-${repartidorId}`]
    );
    const rutaId = resultado.rows[0].id;
    for (const [pedidoId, orden] of pedidosConOrden) {
        await pool.query('INSERT INTO ruta_pedidos (ruta_id, pedido_id, orden) VALUES ($1, $2, $3)', [
            rutaId,
            pedidoId,
            orden,
        ]);
    }
    return rutaId;
}

beforeEach(() => limpiarBase());

afterAll(() => pool.end());

describe('RutaRepositorio.listarPorComercio', () => {
    test('devuelve las rutas del comercio con sus paradas en orden de visita', async () => {
        const almacen = await crearComercio('Almacen');
        const kiosco = await crearComercio('Kiosco');
        const juan = await crearRepartidor('Juan');
        const maria = await crearRepartidor('Maria');
        const ana = await crearPedido(almacen, 'Ana');
        const bruno = await crearPedido(almacen, 'Bruno');
        const carla = await crearPedido(kiosco, 'Carla');
        const rutaAlmacen = await crearRuta(almacen, juan, [
            [ana, 2],
            [bruno, 1],
        ]);
        await crearRuta(kiosco, maria, [[carla, 1]]);

        const lista = await rutas.listarPorComercio(almacen);

        expect(lista).toHaveLength(1);
        expect(lista[0]).toMatchObject({ id: rutaAlmacen, estado: 'lista', repartidor: 'Juan' });
        expect(lista[0].paradas.map((p) => [p.orden, p.nombreCliente])).toEqual([
            [1, 'Bruno'],
            [2, 'Ana'],
        ]);
    });

    test('devuelve una lista vacia si el comercio no tiene rutas', async () => {
        const almacen = await crearComercio('Almacen');

        expect(await rutas.listarPorComercio(almacen)).toEqual([]);
    });
});
