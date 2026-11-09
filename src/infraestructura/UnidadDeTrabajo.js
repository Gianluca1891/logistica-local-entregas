const ProductoRepositorio = require('./ProductoRepositorio');
const PedidoRepositorio = require('./PedidoRepositorio');

class UnidadDeTrabajo {
    constructor(pool) {
        this.pool = pool;
    }

    async ejecutar(trabajo) {
        const cliente = await this.pool.connect();
        try {
            await cliente.query('BEGIN');
            const repositorios = {
                productos: new ProductoRepositorio(cliente),
                pedidos: new PedidoRepositorio(cliente),
            };
            const resultado = await trabajo(repositorios);
            await cliente.query('COMMIT');
            return resultado;
        } catch (error) {
            await cliente.query('ROLLBACK');
            throw error;
        } finally {
            cliente.release();
        }
    }
}

module.exports = UnidadDeTrabajo;
