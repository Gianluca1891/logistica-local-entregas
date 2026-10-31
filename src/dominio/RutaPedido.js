class RutaPedido {
    constructor({ pedidoId, orden = null }) {
        this.pedidoId = pedidoId;
        this.orden = orden;
    }

    fijarOrden(orden) {
        if (!Number.isInteger(orden) || orden <= 0) {
            throw new Error('Orden invalido');
        }
        this.orden = orden;
    }
}

module.exports = RutaPedido;
