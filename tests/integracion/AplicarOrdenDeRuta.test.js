const { pool, limpiarBase, crearComercio, crearRepartidor } = require('./baseDeDatos');
const AplicarOrdenDeRuta = require('../../src/aplicacion/AplicarOrdenDeRuta');
const UnidadDeTrabajo = require('../../src/infraestructura/UnidadDeTrabajo');

const aplicarOrden = new AplicarOrdenDeRuta({ unidadDeTrabajo: new UnidadDeTrabajo(pool) });
let rutaId;

async function consultar(sql) {
    const resultado = await pool.query(sql);
    return resultado.rows;
}

beforeEach(async () => {
    await limpiarBase();
    const comercioId = await crearComercio('Almacen');
    const repartidorId = await crearRepartidor('Juan');
    for (const token of ['token-1', 'token-2', 'token-3']) {
        await pool.query(
            `INSERT INTO pedidos (comercio_id, cliente_nombre, cliente_contacto, direccion_destino,
                                  latitud_destino, longitud_destino, estado, token)
             VALUES ($1, 'Ana', '1122334455', 'Calle 1', -34.6, -58.4, 'asignado', $2)`,
            [comercioId, token]
        );
    }
    const ruta = await pool.query(
        "INSERT INTO rutas (comercio_id, repartidor_id, solicitud_id) VALUES ($1, $2, 'solicitud-1') RETURNING id",
        [comercioId, repartidorId]
    );
    rutaId = ruta.rows[0].id;
    await pool.query('INSERT INTO ruta_pedidos (ruta_id, pedido_id) VALUES ($1, 1), ($1, 2), ($1, 3)', [rutaId]);
});

afterAll(() => pool.end());

describe('AplicarOrdenDeRuta', () => {
    test('guarda el orden en ruta_pedidos y la ruta queda lista', async () => {
        await aplicarOrden.ejecutar({ rutaId, orden: [2, 3, 1] });

        expect(await consultar('SELECT pedido_id, orden FROM ruta_pedidos ORDER BY orden')).toEqual([
            { pedido_id: 2, orden: 1 },
            { pedido_id: 3, orden: 2 },
            { pedido_id: 1, orden: 3 },
        ]);
        expect(await consultar('SELECT estado FROM rutas')).toEqual([{ estado: 'lista' }]);
    });

    test('un resultado repetido no cambia el orden ya guardado', async () => {
        await aplicarOrden.ejecutar({ rutaId, orden: [2, 3, 1] });

        await aplicarOrden.ejecutar({ rutaId, orden: [1, 2, 3] });

        expect(await consultar('SELECT pedido_id FROM ruta_pedidos WHERE orden = 1')).toEqual([{ pedido_id: 2 }]);
    });
});
