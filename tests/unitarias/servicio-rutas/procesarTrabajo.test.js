const procesarTrabajo = require('../../../src/servicio-rutas/procesarTrabajo');

function crearColaFalsa() {
    const cola = {
        agregados: [],
        add: async (nombre, datos, opciones) => {
            cola.agregados.push({ nombre, datos, opciones });
        },
    };
    return cola;
}

const datosValidos = {
    rutaId: 5,
    solicitudId: 'solicitud-5',
    origen: { latitud: 0, longitud: 0 },
    paradas: [
        { id: 20, latitud: 0, longitud: 0.02 },
        { id: 10, latitud: 0, longitud: 0.01 },
    ],
};

describe('procesarTrabajo', () => {
    test('calcula el orden y lo publica en la cola de resultados', async () => {
        const resultados = crearColaFalsa();

        const orden = await procesarTrabajo(datosValidos, resultados);

        expect(orden).toEqual([10, 20]);
        expect(resultados.agregados).toEqual([
            {
                nombre: 'resultado',
                datos: { rutaId: 5, orden: [10, 20] },
                opciones: { jobId: 'resultado-solicitud-5', attempts: 3, backoff: { type: 'fixed', delay: 1000 } },
            },
        ]);
    });

    test('rechaza un trabajo sin paradas y no publica nada', async () => {
        const resultados = crearColaFalsa();

        await expect(procesarTrabajo({ ...datosValidos, paradas: [] }, resultados)).rejects.toThrow(
            'Trabajo invalido'
        );
        expect(resultados.agregados).toHaveLength(0);
    });

    test('rechaza un trabajo con coordenadas que no son numeros', async () => {
        const resultados = crearColaFalsa();
        const paradas = [{ id: 1, latitud: 'abc', longitud: 0 }];

        await expect(procesarTrabajo({ ...datosValidos, paradas }, resultados)).rejects.toThrow(
            'Trabajo invalido'
        );
    });
});
