const { pool, limpiarBase, crearComercio } = require('./baseDeDatos');
const ProductoRepositorio = require('../../src/infraestructura/ProductoRepositorio');
const Producto = require('../../src/dominio/Producto');

const repositorio = new ProductoRepositorio(pool);
let comercioId;

beforeEach(async () => {
    await limpiarBase();
    comercioId = await crearComercio('Almacen');
});

afterAll(() => pool.end());

describe('ProductoRepositorio', () => {
    test('crea un producto y lo devuelve como objeto del dominio', async () => {
        const producto = await repositorio.crear({ comercioId, nombre: 'Yerba', stock: 10 });

        expect(producto).toBeInstanceOf(Producto);
        expect(producto.id).toBeDefined();
        expect(producto.comercioId).toBe(comercioId);
        expect(producto.stock).toBe(10);
    });

    test('busca un producto por id', async () => {
        const creado = await repositorio.crear({ comercioId, nombre: 'Yerba', stock: 10 });

        const encontrado = await repositorio.buscarPorId(creado.id);

        expect(encontrado.nombre).toBe('Yerba');
        expect(encontrado.hayStock(10)).toBe(true);
    });

    test('devuelve null si el producto no existe', async () => {
        expect(await repositorio.buscarPorId(999)).toBeNull();
    });

    test('lista solo los productos del comercio pedido', async () => {
        const otroComercioId = await crearComercio('Kiosco');
        await repositorio.crear({ comercioId, nombre: 'Yerba', stock: 10 });
        await repositorio.crear({ comercioId, nombre: 'Galletitas', stock: 5 });
        await repositorio.crear({ comercioId: otroComercioId, nombre: 'Gaseosa', stock: 3 });

        const productos = await repositorio.buscarPorComercio(comercioId);

        expect(productos.map((p) => p.nombre)).toEqual(['Yerba', 'Galletitas']);
    });

    test('guarda el stock despues de descontar', async () => {
        const producto = await repositorio.crear({ comercioId, nombre: 'Yerba', stock: 10 });

        producto.descontar(3);
        await repositorio.actualizarStock(producto);

        const guardado = await repositorio.buscarPorId(producto.id);
        expect(guardado.stock).toBe(7);
    });

    test('la base rechaza un stock negativo aunque el codigo lo permita', async () => {
        const producto = await repositorio.crear({ comercioId, nombre: 'Yerba', stock: 10 });

        producto.stock = -1;

        await expect(repositorio.actualizarStock(producto)).rejects.toThrow('productos_stock_check');
    });
    
    test('listarConComercio devuelve los productos con el nombre de su comercio', async () => {
        const kioscoId = await crearComercio('Kiosco');
        await repositorio.crear({ comercioId: kioscoId, nombre: 'Alfajor', stock: 50 });
        await repositorio.crear({ comercioId, nombre: 'Yerba', stock: 10 });

        const lista = await repositorio.listarConComercio();

        expect(lista).toEqual([
            { id: 2, nombre: 'Yerba', stock: 10, comercioId, comercioNombre: 'Almacen' },
            { id: 1, nombre: 'Alfajor', stock: 50, comercioId: kioscoId, comercioNombre: 'Kiosco' },
        ]);
    });
});
