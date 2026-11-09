class Pedido {
    constructor({ id, comercioId, nombreCliente, contactoCliente, direccionDestino, latitudDestino, longitudDestino, token, estado = 'pendiente', items = [] }) {
        this.id = id;
        this.comercioId = comercioId;
        this.nombreCliente = nombreCliente;
        this.contactoCliente = contactoCliente;
        this.direccionDestino = direccionDestino;
        this.latitudDestino = latitudDestino;
        this.longitudDestino = longitudDestino;
        this.token = token;
        this.items = items;
        this.estado = estado;
    }

    obtenerEstado() {
        return this.estado;
    }

    estaPendiente() {
        return this.estado === 'pendiente';
    }

    marcarAsignado() {
        this.cambiarEstado('pendiente', 'asignado');
    }

    marcarRetirado() {
        this.cambiarEstado('asignado', 'retirado');
    }

    marcarEntregado() {
        this.cambiarEstado('retirado', 'entregado');
    }

    cambiarEstado(estadoEsperado, estadoNuevo) {
        if (this.estado !== estadoEsperado) {
            throw new Error('Transicion invalida');
        }
        this.estado = estadoNuevo;
    }
}

module.exports = Pedido;
