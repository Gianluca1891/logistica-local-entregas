const Producto = require('../dominio/Producto');

function aProducto(fila) {
    return new Producto({
        id: fila.id,
        comercioId: fila.comercio_id,
        nombre: fila.nombre,
        stock: fila.stock,
    });
}

class ProductoRepositorio {
    constructor(db) {
        this.db = db;
    }

    async crear({ comercioId, nombre, stock }) {
        const resultado = await this.db.query(
            'INSERT INTO productos (comercio_id, nombre, stock) VALUES ($1, $2, $3) RETURNING *',
            [comercioId, nombre, stock]
        );
        return aProducto(resultado.rows[0]);
    }

    async buscarPorId(id) {
        const resultado = await this.db.query('SELECT * FROM productos WHERE id = $1', [id]);
        if (resultado.rows.length === 0) {
            return null;
        }
        return aProducto(resultado.rows[0]);
    }

    async buscarPorComercio(comercioId) {
        const resultado = await this.db.query(
            'SELECT * FROM productos WHERE comercio_id = $1 ORDER BY id',
            [comercioId]
        );
        return resultado.rows.map(aProducto);
    }

    async buscarParaActualizar(ids) {
        const resultado = await this.db.query(
            'SELECT * FROM productos WHERE id = ANY($1) ORDER BY id FOR UPDATE',
            [ids]
        );
        return resultado.rows.map(aProducto);
    }

    async listarConComercio() {
        const resultado = await this.db.query(
            `SELECT p.id, p.nombre, p.stock, c.id AS comercio_id, c.nombre AS comercio_nombre
             FROM productos p
             JOIN comercios c ON c.id = p.comercio_id
             ORDER BY c.id, p.id`
        );
        return resultado.rows.map((fila) => ({
            id: fila.id,
            nombre: fila.nombre,
            stock: fila.stock,
            comercioId: fila.comercio_id,
            comercioNombre: fila.comercio_nombre,
        }));
    }

    async actualizarStock(producto) {
        await this.db.query('UPDATE productos SET stock = $1 WHERE id = $2', [producto.stock, producto.id]);
    }
}

module.exports = ProductoRepositorio;
