const CrearPedido = require('../../src/aplicacion/CrearPedido');
const Producto = require('../../src/dominio/Producto');

function crearDobles(productos) {
    const stockGuardado = [];
    const pedidosGuardados = [];
    const repositorios = {
        productos: {
            buscarParaActualizar: async (ids) => productos.filter((p) => ids.includes(p.id)),
            actualizarStock: async (producto) => stockGuardado.push(producto.id),
        },
        pedidos: {
            crear: async (pedido) => {
                pedidosGuardados.push(pedido);
                return pedido;
            },
        },
    };
    const unidadDeTrabajo = { ejecutar: (trabajo) => trabajo(repositorios) };
    return { unidadDeTrabajo, stockGuardado, pedidosGuardados };
}

const datosCliente = {
    comercioId: 1,
    nombreCliente: 'Ana',
    contactoCliente: '1122334455',
    direccionDestino: 'Av. Siempre Viva 742',
    latitudDestino: -34.6,
    longitudDestino: -58.4,
};

describe('CrearPedido', () => {
    test('crea el pedido, descuenta el stock y genera el token', async () => {
        const yerba = new Producto({ id: 10, comercioId: 1, nombre: 'Yerba', stock: 5 });
        const dobles = crearDobles([yerba]);
        const servicio = new CrearPedido({ unidadDeTrabajo: dobles.unidadDeTrabajo, generarToken: () => 'token-fijo' });

        const pedido = await servicio.ejecutar({ ...datosCliente, items: [{ productoId: 10, cantidad: 2 }] });

        expect(pedido.token).toBe('token-fijo');
        expect(pedido.estaPendiente()).toBe(true);
        expect(yerba.stock).toBe(3);
        expect(dobles.stockGuardado).toEqual([10]);
        expect(dobles.pedidosGuardados).toHaveLength(1);
    });

    test('rechaza un pedido sin productos', async () => {
        const dobles = crearDobles([]);
        const servicio = new CrearPedido({ unidadDeTrabajo: dobles.unidadDeTrabajo });

        await expect(servicio.ejecutar({ ...datosCliente, items: [] })).rejects.toThrow(
            'El pedido debe tener al menos un producto'
        );
    });

    test('rechaza un producto repetido en el pedido', async () => {
        const yerba = new Producto({ id: 10, comercioId: 1, nombre: 'Yerba', stock: 5 });
        const dobles = crearDobles([yerba]);
        const servicio = new CrearPedido({ unidadDeTrabajo: dobles.unidadDeTrabajo });

        await expect(
            servicio.ejecutar({
                ...datosCliente,
                items: [
                    { productoId: 10, cantidad: 1 },
                    { productoId: 10, cantidad: 1 },
                ],
            })
        ).rejects.toThrow('Producto repetido en el pedido');

        expect(yerba.stock).toBe(5);
    });

    test('rechaza productos de otro comercio', async () => {
        const ajeno = new Producto({ id: 20, comercioId: 2, nombre: 'Gaseosa', stock: 5 });
        const dobles = crearDobles([ajeno]);
        const servicio = new CrearPedido({ unidadDeTrabajo: dobles.unidadDeTrabajo });

        await expect(
            servicio.ejecutar({ ...datosCliente, items: [{ productoId: 20, cantidad: 1 }] })
        ).rejects.toThrow('Todos los productos deben ser del mismo comercio');
    });

    test('si un item no tiene stock, no descuenta ninguno', async () => {
        const yerba = new Producto({ id: 10, comercioId: 1, nombre: 'Yerba', stock: 5 });
        const galletitas = new Producto({ id: 11, comercioId: 1, nombre: 'Galletitas', stock: 1 });
        const dobles = crearDobles([yerba, galletitas]);
        const servicio = new CrearPedido({ unidadDeTrabajo: dobles.unidadDeTrabajo });

        await expect(
            servicio.ejecutar({
                ...datosCliente,
                items: [
                    { productoId: 10, cantidad: 2 },
                    { productoId: 11, cantidad: 3 },
                ],
            })
        ).rejects.toThrow('Stock insuficiente');

        expect(yerba.stock).toBe(5);
        expect(dobles.stockGuardado).toEqual([]);
        expect(dobles.pedidosGuardados).toEqual([]);
    });
});
