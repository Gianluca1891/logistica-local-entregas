const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const IniciarSesion = require('../../src/aplicacion/IniciarSesion');

const SECRETO = 'secreto-de-prueba';
const usuarioGuardado = {
    id: 1,
    email: 'almacen@demo.com',
    passwordHash: bcrypt.hashSync('demo1234', 4),
    rol: 'comercio',
    comercioId: 1,
    repartidorId: null,
};

const usuariosFalso = {
    buscarPorEmail: async (email) => (email === usuarioGuardado.email ? usuarioGuardado : null),
};

const servicio = new IniciarSesion({ usuarios: usuariosFalso, secreto: SECRETO });

describe('IniciarSesion', () => {
    test('con la contrasena correcta devuelve un token con el rol y el comercio', async () => {
        const resultado = await servicio.ejecutar({ email: 'almacen@demo.com', password: 'demo1234' });

        expect(resultado.rol).toBe('comercio');
        const datos = jwt.verify(resultado.token, SECRETO);
        expect(datos.usuarioId).toBe(1);
        expect(datos.rol).toBe('comercio');
        expect(datos.comercioId).toBe(1);
    });

    test('rechaza una contrasena incorrecta', async () => {
        await expect(
            servicio.ejecutar({ email: 'almacen@demo.com', password: 'otra' })
        ).rejects.toThrow('Credenciales invalidas');
    });

    test('rechaza un email que no existe con el mismo mensaje', async () => {
        await expect(
            servicio.ejecutar({ email: 'nadie@demo.com', password: 'demo1234' })
        ).rejects.toThrow('Credenciales invalidas');
    });
});
