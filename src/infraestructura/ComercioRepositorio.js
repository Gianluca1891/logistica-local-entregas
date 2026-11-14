class ComercioRepositorio {
    constructor(db) {
        this.db = db;
    }

    async buscarUbicacion(id) {
        const resultado = await this.db.query('SELECT latitud, longitud FROM comercios WHERE id = $1', [id]);
        if (resultado.rows.length === 0) {
            return null;
        }
        return { latitud: resultado.rows[0].latitud, longitud: resultado.rows[0].longitud };
    }
}

module.exports = ComercioRepositorio;
