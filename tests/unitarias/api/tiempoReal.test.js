const http = require('http');
const { WebSocket } = require('ws');
const crearTiempoReal = require('../../../src/api/tiempoReal');

const seguimientoDeAna = {
    pedidoId: 7,
    estado: 'asignado',
    direccionDestino: 'Thames 1600',
    latitudDestino: -34.58,
    longitudDestino: -58.42,
};

let servidor;
let tiempoReal;
let url;

beforeEach(async () => {
    tiempoReal = crearTiempoReal({
        buscarSeguimiento: async (token) => {
            if (token === 'token-entregado') {
                return { ...seguimientoDeAna, pedidoId: 8, estado: 'entregado' };
            }
            return token === 'token-ana' ? seguimientoDeAna : null;
        },
    });
    servidor = http.createServer();
    tiempoReal.adjuntar(servidor);
    await new Promise((listo) => servidor.listen(0, listo));
    url = `ws://localhost:${servidor.address().port}/ws`;
});

afterEach(async () => {
    await new Promise((listo) => servidor.close(listo));
});

function conectar() {
    const socket = new WebSocket(url);
    const recibidos = [];
    socket.on('message', (texto) => recibidos.push(JSON.parse(texto)));
    const abierto = new Promise((listo) => socket.on('open', listo));
    return { socket, recibidos, abierto };
}

async function esperarMensajes(recibidos, cantidad) {
    for (let intento = 0; intento < 50 && recibidos.length < cantidad; intento++) {
        await new Promise((listo) => setTimeout(listo, 20));
    }
}

describe('tiempoReal (WebSocket)', () => {
    test('al suscribirse con el token recibe el estado actual del pedido', async () => {
        const cliente = conectar();
        await cliente.abierto;

        cliente.socket.send(JSON.stringify({ tipo: 'suscribir', token: 'token-ana' }));
        await esperarMensajes(cliente.recibidos, 1);

        expect(cliente.recibidos).toEqual([{ tipo: 'seguimiento', ...seguimientoDeAna }]);
        cliente.socket.terminate();
    });

    test('recibe lo que se publica para su pedido y no lo de otros', async () => {
        const cliente = conectar();
        await cliente.abierto;
        cliente.socket.send(JSON.stringify({ tipo: 'suscribir', token: 'token-ana' }));
        await esperarMensajes(cliente.recibidos, 1);

        tiempoReal.publicar([99], { tipo: 'estado', estado: 'entregado' });
        tiempoReal.publicar([7], { tipo: 'estado', estado: 'retirado' });
        await esperarMensajes(cliente.recibidos, 2);

        expect(cliente.recibidos.slice(1)).toEqual([{ tipo: 'estado', estado: 'retirado' }]);
        cliente.socket.terminate();
    });

    test('un token inexistente recibe un error', async () => {
        const cliente = conectar();
        await cliente.abierto;

        cliente.socket.send(JSON.stringify({ tipo: 'suscribir', token: 'inventado' }));
        await esperarMensajes(cliente.recibidos, 1);

        expect(cliente.recibidos).toEqual([{ tipo: 'error', error: 'Pedido no encontrado' }]);
        cliente.socket.terminate();
    });

    test('un mensaje que no es JSON no rompe la conexion', async () => {
        const cliente = conectar();
        await cliente.abierto;

        cliente.socket.send('esto no es json');
        cliente.socket.send(JSON.stringify({ tipo: 'suscribir', token: 'token-ana' }));
        await esperarMensajes(cliente.recibidos, 2);

        expect(cliente.recibidos[0]).toEqual({ tipo: 'error', error: 'Mensaje invalido' });
        expect(cliente.recibidos[1].tipo).toBe('seguimiento');
        cliente.socket.terminate();
    });

    test('al entregar el pedido se corta el seguimiento', async () => {
        const cliente = conectar();
        await cliente.abierto;
        cliente.socket.send(JSON.stringify({ tipo: 'suscribir', token: 'token-ana' }));
        await esperarMensajes(cliente.recibidos, 1);

        tiempoReal.publicar([7], { tipo: 'estado', estado: 'entregado' });
        tiempoReal.publicar([7], { tipo: 'posicion', latitud: -34.6, longitud: -58.4 });
        await esperarMensajes(cliente.recibidos, 3);

        expect(cliente.recibidos.slice(1)).toEqual([{ tipo: 'estado', estado: 'entregado' }]);
        cliente.socket.terminate();
    });

    test('un pedido ya entregado recibe su estado pero no queda suscripto', async () => {
        const cliente = conectar();
        await cliente.abierto;
        cliente.socket.send(JSON.stringify({ tipo: 'suscribir', token: 'token-entregado' }));
        await esperarMensajes(cliente.recibidos, 1);

        tiempoReal.publicar([8], { tipo: 'posicion', latitud: -34.6, longitud: -58.4 });
        await esperarMensajes(cliente.recibidos, 2);

        expect(cliente.recibidos).toEqual([{ tipo: 'seguimiento', ...seguimientoDeAna, pedidoId: 8, estado: 'entregado' }]);
        cliente.socket.terminate();
    });
});
