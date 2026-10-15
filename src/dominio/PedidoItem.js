class PedidoItem {
    constructor({producto, cantidad}) {
        this.producto = producto;
        this.cantidad = cantidad;
    }

    validar() {
        if (!Number.isInteger(this.cantidad) ||this.cantidad<=0) {
            throw new Error('Cantidad invalida');
        }
        if (!this.producto.hayStock(this.cantidad)) {
            throw new Error('Stock insuficiente');
        }
    }
}

module.exports = PedidoItem;