class Ruta {
    constructor({ id, comercioId, repartidorId, solicitudId, estado = 'pendiente', rutaPedidos }) {
        if (!rutaPedidos || rutaPedidos.length === 0) {
            throw new Error('La ruta debe tener al menos un pedido');
        }
        this.id = id;
        this.comercioId = comercioId;
        this.repartidorId = repartidorId;
        this.solicitudId = solicitudId;
        this.estado = estado;
        this.rutaPedidos = rutaPedidos;
    }

    aplicarOrden(pedidoIds) {
        if (this.estado !== 'pendiente') {
            throw new Error('Transicion invalida');
        }
        if (!this.esOrdenCompleto(pedidoIds)) {
            throw new Error('Orden incompleto');
        }
        pedidoIds.forEach((pedidoId, posicion) => {
            const rutaPedido = this.rutaPedidos.find((rp) => rp.pedidoId === pedidoId);
            rutaPedido.fijarOrden(posicion + 1);
        });
        this.estado = 'lista';
    }

    iniciar() {
        this.cambiarEstado('lista', 'en_curso');
    }

    finalizar() {
        this.cambiarEstado('en_curso', 'finalizada');
    }

    esOrdenCompleto(pedidoIds) {
        const idsDeLaRuta = this.rutaPedidos.map((rp) => rp.pedidoId);
        const idsSinRepetir = new Set(pedidoIds);
        return (
            pedidoIds.length === idsDeLaRuta.length &&
            idsSinRepetir.size === pedidoIds.length &&
            idsDeLaRuta.every((id) => idsSinRepetir.has(id))
        );
    }

    cambiarEstado(estadoEsperado, estadoNuevo) {
        if (this.estado !== estadoEsperado) {
            throw new Error('Transicion invalida');
        }
        this.estado = estadoNuevo;
    }
}

module.exports = Ruta;
