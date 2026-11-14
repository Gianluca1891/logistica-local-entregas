const { pool, limpiarBase, crearComercio, crearRepartidor } = require('./baseDeDatos');
const UnidadDeTrabajo = require('../../src/infraestructura/UnidadDeTrabajo');
const SolicitarRuta = require('../../src/aplicacion/SolicitarRuta');
const AplicarOrdenDeRuta = require('../../src/aplicacion/AplicarOrdenDeRuta');
const IniciarRuta = require('../../src/aplicacion/IniciarRuta');
const EntregarPedido = require('../../src/aplicacion/EntregarPedido');
const { calcularRuta } = require('../../src/servicio-rutas/calcularRuta');

const unidadDeTrabajo = new UnidadDeTrabajo(pool);

async function consultar(sql) {
    const resultado = await pool.query(sql);
    return resultado.rows;
}

beforeEach(() => limpiarBase());

afterAll(() => pool.end());

test('flujo completo: solicitar, calcular, iniciar y entregar libera al repartidor', async () => {
    const comercioId = await crearComercio('Almacen');
    const repartidorId = await crearRepartidor('Juan');
    for (const [token, longitud] of [
        ['token-1', -58.42],
        ['token-2', -58.41],
    ]) {
        await pool.query(
            `INSERT INTO pedidos (comercio_id, cliente_nombre, cliente_contacto, direccion_destino,
                                  latitud_destino, longitud_destino, token)
             VALUES ($1, 'Ana', '1122334455', 'Calle 1', -34.6, $2, $3)`,
            [comercioId, longitud, token]
        );
    }

    const encolados = [];
    const colaRutas = { add: async (nombre, datos) => encolados.push(datos) };
    const ruta = await new SolicitarRuta({ unidadDeTrabajo, colaRutas }).ejecutar(comercioId);
    const orden = calcularRuta(encolados[0].origen, encolados[0].paradas);
    await new AplicarOrdenDeRuta({ unidadDeTrabajo }).ejecutar({ rutaId: ruta.id, orden });
    await new IniciarRuta({ unidadDeTrabajo }).ejecutar(repartidorId);

    const entregar = new EntregarPedido({ unidadDeTrabajo });
    const primero = await entregar.ejecutar({ repartidorId, pedidoId: orden[0] });
    expect(primero.rutaFinalizada).toBe(false);
    const ultimo = await entregar.ejecutar({ repartidorId, pedidoId: orden[1] });
    expect(ultimo.rutaFinalizada).toBe(true);

    expect(await consultar('SELECT estado FROM rutas')).toEqual([{ estado: 'finalizada' }]);
    expect(await consultar("SELECT COUNT(*)::int AS n FROM pedidos WHERE estado = 'entregado'")).toEqual([{ n: 2 }]);
    expect(await consultar('SELECT disponible FROM repartidores')).toEqual([{ disponible: true }]);
});
