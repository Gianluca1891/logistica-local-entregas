const { pool, limpiarBase, crearComercio, crearRepartidor } = require('./baseDeDatos');
const SolicitarRuta = require('../../src/aplicacion/SolicitarRuta');
const UnidadDeTrabajo = require('../../src/infraestructura/UnidadDeTrabajo');

let comercioId;

function crearColaFalsa({ falla = false } = {}) {
    const cola = {
        encolados: [],
        add: async (nombre, datos) => {
            if (falla) {
                throw new Error('ECONNREFUSED');
            }
            cola.encolados.push(datos);
        },
    };
    return cola;
}

async function crearPedido(token) {
    await pool.query(
        `INSERT INTO pedidos (comercio_id, cliente_nombre, cliente_contacto, direccion_destino,
                              latitud_destino, longitud_destino, token)
         VALUES ($1, 'Ana', '1122334455', 'Calle 1', -34.6, -58.4, $2)`,
        [comercioId, token]
    );
}

async function consultar(sql) {
    const resultado = await pool.query(sql);
    return resultado.rows;
}

beforeEach(async () => {
    await limpiarBase();
    comercioId = await crearComercio('Almacen');
});

afterAll(() => pool.end());

describe('SolicitarRuta', () => {
    test('crea la ruta, asigna los pedidos y ocupa al repartidor', async () => {
        const repartidorId = await crearRepartidor('Juan');
        await crearPedido('token-1');
        await crearPedido('token-2');
        const colaRutas = crearColaFalsa();
        const servicio = new SolicitarRuta({ unidadDeTrabajo: new UnidadDeTrabajo(pool), colaRutas });

        const ruta = await servicio.ejecutar(comercioId);

        expect(await consultar('SELECT estado, repartidor_id FROM rutas')).toEqual([
            { estado: 'pendiente', repartidor_id: repartidorId },
        ]);
        expect(await consultar('SELECT pedido_id FROM ruta_pedidos ORDER BY pedido_id')).toEqual([
            { pedido_id: 1 },
            { pedido_id: 2 },
        ]);
        expect(await consultar("SELECT COUNT(*)::int AS n FROM pedidos WHERE estado = 'asignado'")).toEqual([
            { n: 2 },
        ]);
        expect(await consultar('SELECT disponible FROM repartidores')).toEqual([{ disponible: false }]);
        expect(colaRutas.encolados[0].rutaId).toBe(ruta.id);
        expect(colaRutas.encolados[0].origen).toEqual({ latitud: -34.6, longitud: -58.4 });
    });

    test('si no se puede encolar no queda nada a medias (rollback)', async () => {
        await crearRepartidor('Juan');
        await crearPedido('token-1');
        const servicio = new SolicitarRuta({
            unidadDeTrabajo: new UnidadDeTrabajo(pool),
            colaRutas: crearColaFalsa({ falla: true }),
        });

        await expect(servicio.ejecutar(comercioId)).rejects.toThrow('Servicio de rutas no disponible');

        expect(await consultar('SELECT * FROM rutas')).toEqual([]);
        expect(await consultar('SELECT estado FROM pedidos')).toEqual([{ estado: 'pendiente' }]);
        expect(await consultar('SELECT disponible FROM repartidores')).toEqual([{ disponible: true }]);
    });

    test('dos solicitudes simultaneas: solo una se lleva los pedidos', async () => {
        await crearRepartidor('Juan');
        await crearRepartidor('Maria');
        await crearPedido('token-1');
        const servicio = new SolicitarRuta({
            unidadDeTrabajo: new UnidadDeTrabajo(pool),
            colaRutas: crearColaFalsa(),
        });

        const resultados = await Promise.allSettled([servicio.ejecutar(comercioId), servicio.ejecutar(comercioId)]);

        const motivos = resultados.filter((r) => r.status === 'rejected').map((r) => r.reason.message);
        expect(motivos).toEqual(['No hay pedidos pendientes']);
        expect(await consultar('SELECT COUNT(*)::int AS n FROM rutas')).toEqual([{ n: 1 }]);
        expect(await consultar("SELECT COUNT(*)::int AS n FROM repartidores WHERE disponible")).toEqual([{ n: 1 }]);
    });
});
