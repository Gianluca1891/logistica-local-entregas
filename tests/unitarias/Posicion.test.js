const Posicion = require('../../src/dominio/Posicion');

describe('Posicion', () => {
    test('se crea con coordenadas validas', () => {
        const posicion = new Posicion({ rutaId: 1, latitud: -34.6, longitud: -58.4 });
        expect(posicion.latitud).toBe(-34.6);
        expect(posicion.longitud).toBe(-58.4);
    });

    test('registra la fecha si no se la pasan', () => {
        const posicion = new Posicion({ rutaId: 1, latitud: 0, longitud: 0 });
        expect(posicion.registradoEn).toBeInstanceOf(Date);
    });

    test.each([
        ['latitud mayor a 90', 91, 0],
        ['latitud menor a -90', -91, 0],
        ['longitud mayor a 180', 0, 181],
        ['longitud menor a -180', 0, -181],
        ['latitud no numerica', 'abc', 0],
        ['longitud nula', 0, null],
    ])('rechaza %s', (_, latitud, longitud) => {
        expect(() => new Posicion({ rutaId: 1, latitud, longitud })).toThrow('Coordenadas invalidas');
    });
});