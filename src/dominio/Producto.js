class Producto {
    constructor({ id, nombre, stock }) {
        this.id = id;
        this.nombre = nombre;
        this.stock = stock;
    }

    hayStock(cantidad) {
        return this.stock >= cantidad;
    }

    descontar(cantidad) {
        if (!Number.isInteger(cantidad) ||cantidad <= 0) {
            throw new Error('Cantidad invalida');
        }
        if (!this.hayStock(cantidad)) {
            throw new Error('Stock insuficiente');
        }
        this.stock -= cantidad;
    }

}



module.exports = Producto;