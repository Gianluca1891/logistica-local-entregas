const { distanciaKm, calcularRuta } = require('../../../src/servicio-rutas/calcularRuta');

describe('distanciaKm', () => {
    test('es 0 entre un punto y si mismo', () => {
        const punto = { latitud: -34.6, longitud: -58.4 };

        expect(distanciaKm(punto, punto)).toBe(0);
    });

    test('calcula la distancia entre el Obelisco y Plaza de Mayo (unos 1.1 km)', () => {
        const obelisco = { latitud: -34.6037, longitud: -58.3816 };
        const plazaDeMayo = { latitud: -34.6083, longitud: -58.3712 };

        expect(distanciaKm(obelisco, plazaDeMayo)).toBeCloseTo(1.08, 2);
    });

    test('da lo mismo en los dos sentidos', () => {
        const a = { latitud: -34.58, longitud: -58.42 };
        const b = { latitud: -34.6, longitud: -58.38 };

        expect(distanciaKm(a, b)).toBeCloseTo(distanciaKm(b, a), 10);
    });
});

describe('calcularRuta', () => {
    const comercio = { latitud: 0, longitud: 0 };

    test('visita primero la parada mas cercana y sigue por la mas cercana a esa', () => {
        const paradas = [
            { id: 30, latitud: 0, longitud: 0.03 },
            { id: 10, latitud: 0, longitud: 0.01 },
            { id: 20, latitud: 0, longitud: 0.02 },
        ];

        expect(calcularRuta(comercio, paradas)).toEqual([10, 20, 30]);
    });

    test('no siempre va en linea recta: elige la mas cercana desde donde esta', () => {
        const paradas = [
            { id: 1, latitud: 0, longitud: 0.01 },
            { id: 2, latitud: 0, longitud: -0.015 },
            { id: 3, latitud: 0, longitud: 0.02 },
        ];

        expect(calcularRuta(comercio, paradas)).toEqual([1, 3, 2]);
    });

    test('con una sola parada devuelve esa parada', () => {
        expect(calcularRuta(comercio, [{ id: 7, latitud: 1, longitud: 1 }])).toEqual([7]);
    });

    test('no modifica la lista que recibe', () => {
        const paradas = [
            { id: 2, latitud: 0, longitud: 0.02 },
            { id: 1, latitud: 0, longitud: 0.01 },
        ];

        calcularRuta(comercio, paradas);

        expect(paradas.map((p) => p.id)).toEqual([2, 1]);
    });
});
