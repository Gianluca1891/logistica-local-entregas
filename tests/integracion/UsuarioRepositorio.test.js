const { pool, limpiarBase, crearComercio } = require('./baseDeDatos');
const UsuarioRepositorio = require('../../src/infraestructura/UsuarioRepositorio');

const usuarios = new UsuarioRepositorio(pool);

beforeEach(() => limpiarBase());

afterAll(() => pool.end());

describe('UsuarioRepositorio', () => {
    test('buscarPorEmail devuelve el usuario con su rol y su comercio', async () => {
        const comercioId = await crearComercio('Almacen');

        const usuario = await usuarios.buscarPorEmail('Almacen@test.com');

        expect(usuario.rol).toBe('comercio');
        expect(usuario.comercioId).toBe(comercioId);
        expect(usuario.repartidorId).toBeNull();
        expect(usuario.passwordHash).toBe('x');
    });

    test('buscarPorEmail devuelve null si el email no existe', async () => {
        expect(await usuarios.buscarPorEmail('nadie@test.com')).toBeNull();
    });
});
