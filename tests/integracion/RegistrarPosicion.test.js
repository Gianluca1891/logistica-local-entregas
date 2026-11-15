const { pool, limpiarBase, crearComercio, crearRepartidor } = require('./baseDeDatos');
const UnidadDeTrabajo = require('../../src/infraestructura/UnidadDeTrabajo');
const PedidoRepositorio = require('../../src/infraestructura/PedidoRepositorio');
const RutaRepositorio = require('../../src/infraestructura/RutaRepositorio');
const RegistrarPosicion = require('../../src/aplicacion/RegistrarPosicion');

const registrarPosicion = new RegistrarPosicion({ unidadDeTrabajo: new UnidadDeTrabajo(pool) });

async function crearRutaEnCurso(comercioId, repartidorId) {
    const pedido = await pool.query(
        `INSERT INTO pedidos (comercio_id, cliente_nombre, cliente_contacto, direccion_destino,
                              latitud_destino, longitud_destino, estado, token)
         VALUES ($1, 'Ana', '1122334455', 'Calle 1', -34.58, -58.42, 'retirado', 'token-ana')
         RETURNING id`,
        [comercioId]
    );
    const ruta = await pool.query(
        "INSERT INTO rutas (comercio_id, repartidor_id, solicitud_id, estado) VALUES ($1, $2, 's-1', 'en_curso') RETURNING id",
        [comercioId, repartidorId]
    );
    await pool.query('INSERT INTO ruta_pedidos (ruta_id, pedido_id, orden) VALUES ($1, $2, 1)', [
        ruta.rows[0].id,
        pedido.rows[0].id,
    ]);
}

beforeEach(() => limpiarBase());

afterAll(() => pool.end());

test('la ultima posicion aparece en el seguimiento y en la ruta, y se oculta al entregar', async () => {
    const comercioId = await crearComercio('Almacen');
    const repartidorId = await crearRepartidor('Juan');
    await crearRutaEnCurso(comercioId, repartidorId);
    const pedidos = new PedidoRepositorio(pool);

    expect((await pedidos.buscarSeguimiento('token-ana')).posicion).toBeNull();

    await registrarPosicion.ejecutar({ repartidorId, latitud: -34.59, longitud: -58.41 });
    await registrarPosicion.ejecutar({ repartidorId, latitud: -34.585, longitud: -58.415 });

    const { posicion } = await pedidos.buscarSeguimiento('token-ana');
    expect(posicion).toMatchObject({ latitud: -34.585, longitud: -58.415 });
    expect(posicion.registradoEn).toBeInstanceOf(Date);
    const ruta = await new RutaRepositorio(pool).buscarActivaDeRepartidor(repartidorId);
    expect(ruta.origen).toEqual({ latitud: -34.6, longitud: -58.4 });
    expect(ruta.posicion).toEqual({ latitud: -34.585, longitud: -58.415 });

    await pool.query("UPDATE pedidos SET estado = 'entregado' WHERE token = 'token-ana'");
    expect((await pedidos.buscarSeguimiento('token-ana')).posicion).toBeNull();
});
