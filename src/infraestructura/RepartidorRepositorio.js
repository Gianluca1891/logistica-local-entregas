const Repartidor = require('../dominio/Repartidor');

class RepartidorRepositorio {
    constructor(db) {
        this.db = db;
    }

    async buscarDisponibleParaActualizar() {
        const resultado = await this.db.query(
            'SELECT * FROM repartidores WHERE disponible ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED'
        );
        if (resultado.rows.length === 0) {
            return null;
        }
        const fila = resultado.rows[0];
        return new Repartidor({ id: fila.id, nombre: fila.nombre, disponible: fila.disponible });
    }

    async buscarParaActualizar(id) {
        const resultado = await this.db.query('SELECT * FROM repartidores WHERE id = $1 FOR UPDATE', [id]);
        const fila = resultado.rows[0];
        return new Repartidor({ id: fila.id, nombre: fila.nombre, disponible: fila.disponible });
    }

    async actualizar(repartidor) {
        await this.db.query('UPDATE repartidores SET disponible = $1 WHERE id = $2', [
            repartidor.estaDisponible(),
            repartidor.id,
        ]);
    }
}

module.exports = RepartidorRepositorio;
