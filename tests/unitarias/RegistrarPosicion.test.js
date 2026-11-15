const RegistrarPosicion = require('../../src/aplicacion/RegistrarPosicion');
const Ruta = require('../../src/dominio/Ruta');
const RutaPedido = require('../../src/dominio/RutaPedido');

function crearServicio(ruta) {
    const guardadas = [];
    const repositorios = {
        rutas: { buscarActivaParaActualizar: async () => ruta },
        posiciones: { registrar: async (posicion) => guardadas.push(posicion) },
    };
    const unidadDeTrabajo = { ejecutar: (trabajo) => trabajo(repositorios) };
    return { servicio: new RegistrarPosicion({ unidadDeTrabajo }), guardadas };
}

function crearRuta(estado) {
    return new Ruta({ id: 5, estado, rutaPedidos: [new RutaPedido({ pedidoId: 10 })] });
}

describe('RegistrarPosicion', () => {
    test('guarda la posicion en la ruta en curso del repartidor', async () => {
        const { servicio, guardadas } = crearServicio(crearRuta('en_curso'));

        const { ruta, posicion } = await servicio.ejecutar({ repartidorId: 2, latitud: -34.6, longitud: -58.4 });

        expect(ruta.id).toBe(5);
        expect(posicion).toMatchObject({ rutaId: 5, latitud: -34.6, longitud: -58.4 });
        expect(guardadas).toEqual([posicion]);
    });

    test('rechaza si el repartidor no tiene ruta', async () => {
        const { servicio } = crearServicio(null);

        await expect(servicio.ejecutar({ repartidorId: 2, latitud: -34.6, longitud: -58.4 })).rejects.toThrow(
            'No tenes una ruta asignada'
        );
    });

    test('rechaza si la ruta todavia no empezo', async () => {
        const { servicio, guardadas } = crearServicio(crearRuta('lista'));

        await expect(servicio.ejecutar({ repartidorId: 2, latitud: -34.6, longitud: -58.4 })).rejects.toThrow(
            'La ruta no esta en curso'
        );
        expect(guardadas).toEqual([]);
    });

    test('rechaza coordenadas invalidas sin guardar nada', async () => {
        const { servicio, guardadas } = crearServicio(crearRuta('en_curso'));

        await expect(servicio.ejecutar({ repartidorId: 2, latitud: 'abc', longitud: -58.4 })).rejects.toThrow(
            'Coordenadas invalidas'
        );
        expect(guardadas).toEqual([]);
    });
});
