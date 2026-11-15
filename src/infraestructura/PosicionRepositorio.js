class PosicionRepositorio {
    constructor(db) {
        this.db = db;
    }

    async registrar(posicion) {
        await this.db.query('INSERT INTO posiciones (ruta_id, latitud, longitud, registrado_en) VALUES ($1, $2, $3, $4)', [
            posicion.rutaId,
            posicion.latitud,
            posicion.longitud,
            posicion.registradoEn,
        ]);
    }
}

module.exports = PosicionRepositorio;
