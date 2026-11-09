const { pool, limpiarBase, crearComercio } = require('./baseDeDatos');
const CrearPedido = require('../../src/aplicacion/CrearPedido');
const UnidadDeTrabajo = require('../../src/infraestructura/UnidadDeTrabajo');
const ProductoRepositorio = require('../../src/infraestructura/ProductoRepositorio');
const PedidoRepositorio = require('../../src/infraestructura/PedidoRepositorio');

const productos = new ProductoRepositorio(pool);
const pedidos = new PedidoRepositorio(pool);
const crearPedido = new CrearPedido({ unidadDeTrabajo: new UnidadDeTrabajo(pool) });
let comercioId;

function datosPedido(items) {
    return {
        comercioId,
        nombreCliente: 'Ana',
        contactoCliente: '1122334455',
        direccionDestino: 'Av. Siempre Viva 742',
        latitudDestino: -34.6,
        longitudDestino: -58.4,
        items,
    };
}

async function contar(tabla) {
    const resultado = await pool.query(`SELECT COUNT(*)::int AS cantidad FROM ${tabla}`);
    return resultado.rows[0].cantidad;
}

async function abrirConexiones(cantidad) {
    const clientes = await Promise.all(Array.from({ length: cantidad }, () => pool.connect()));
    clientes.forEach((cliente) => cliente.release());
}

beforeEach(async () => {
    await limpiarBase();
    comercioId = await crearComercio('Almacen');
});

afterAll(() => pool.end());

describe('CrearPedido con PostgreSQL', () => {
    test('guarda el pedido con sus items y descuenta el stock', async () => {
        const yerba = await productos.crear({ comercioId, nombre: 'Yerba', stock: 10 });

        const pedido = await crearPedido.ejecutar(datosPedido([{ productoId: yerba.id, cantidad: 3 }]));

        const guardado = await pedidos.buscarPorToken(pedido.token);
        expect(guardado.id).toBe(pedido.id);
        expect(guardado.obtenerEstado()).toBe('pendiente');
        expect((await productos.buscarPorId(yerba.id)).stock).toBe(7);
        expect(await contar('pedido_items')).toBe(1);
    });

    test('si falla un item no queda nada a medias (rollback)', async () => {
        const yerba = await productos.crear({ comercioId, nombre: 'Yerba', stock: 10 });
        const galletitas = await productos.crear({ comercioId, nombre: 'Galletitas', stock: 1 });

        await expect(
            crearPedido.ejecutar(
                datosPedido([
                    { productoId: yerba.id, cantidad: 3 },
                    { productoId: galletitas.id, cantidad: 5 },
                ])
            )
        ).rejects.toThrow('Stock insuficiente');

        expect((await productos.buscarPorId(yerba.id)).stock).toBe(10);
        expect(await contar('pedidos')).toBe(0);
        expect(await contar('pedido_items')).toBe(0);
    });

    test('cinco compras simultaneas del ultimo producto: solo una gana', async () => {
        const yerba = await productos.crear({ comercioId, nombre: 'Yerba', stock: 1 });
        const compra = datosPedido([{ productoId: yerba.id, cantidad: 1 }]);
        await abrirConexiones(5);

        const resultados = await Promise.allSettled(
            [1, 2, 3, 4, 5].map(() => crearPedido.ejecutar(compra))
        );

        const exitosas = resultados.filter((r) => r.status === 'fulfilled');
        const rechazadas = resultados.filter((r) => r.status === 'rejected');
        expect(exitosas).toHaveLength(1);
        expect(rechazadas).toHaveLength(4);
        rechazadas.forEach((r) => expect(r.reason.message).toBe('Stock insuficiente'));
        expect((await productos.buscarPorId(yerba.id)).stock).toBe(0);
        expect(await contar('pedidos')).toBe(1);
    });

    test('buscarPorToken devuelve null si el token no existe', async () => {
        expect(await pedidos.buscarPorToken('no-existe')).toBeNull();
    });
});
