const { WebSocketServer, WebSocket } = require('ws');

function crearTiempoReal({ buscarSeguimiento }) {
    const suscriptores = new Map();

    function enviar(socket, mensaje) {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(mensaje));
        }
    }

    function suscribir(socket, pedidoId) {
        if (!suscriptores.has(pedidoId)) {
            suscriptores.set(pedidoId, new Set());
        }
        suscriptores.get(pedidoId).add(socket);
        socket.on('close', () => suscriptores.get(pedidoId)?.delete(socket));
    }

    async function alRecibir(socket, texto) {
        let mensaje;
        try {
            mensaje = JSON.parse(texto);
        } catch {
            return enviar(socket, { tipo: 'error', error: 'Mensaje invalido' });
        }
        if (mensaje?.tipo !== 'suscribir' || typeof mensaje.token !== 'string') {
            return enviar(socket, { tipo: 'error', error: 'Mensaje invalido' });
        }
        try {
            const seguimiento = await buscarSeguimiento(mensaje.token);
            if (!seguimiento) {
                return enviar(socket, { tipo: 'error', error: 'Pedido no encontrado' });
            }
            suscribir(socket, seguimiento.pedidoId);
            enviar(socket, { tipo: 'seguimiento', ...seguimiento });
        } catch (error) {
            console.error('Error al suscribir por WebSocket:', error.message);
            enviar(socket, { tipo: 'error', error: 'Error interno' });
        }
    }

    function adjuntar(servidor) {
        const wss = new WebSocketServer({ server: servidor, path: '/ws' });
        wss.on('connection', (socket) => {
            socket.on('message', (texto) => alRecibir(socket, texto.toString()));
            socket.on('error', (error) => console.error('Error en un WebSocket:', error.message));
        });
        return wss;
    }

    function publicar(pedidoIds, mensaje) {
        for (const pedidoId of pedidoIds) {
            for (const socket of suscriptores.get(pedidoId) ?? []) {
                enviar(socket, mensaje);
            }
        }
    }

    return { adjuntar, publicar };
}

module.exports = crearTiempoReal;
