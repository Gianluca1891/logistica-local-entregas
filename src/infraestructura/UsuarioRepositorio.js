class UsuarioRepositorio {
    constructor(db) {
        this.db = db;
    }

    async buscarPorEmail(email) {
        const resultado = await this.db.query(
            `SELECT u.id, u.email, u.password_hash, u.rol,
                    c.id AS comercio_id, r.id AS repartidor_id
             FROM usuarios u
             LEFT JOIN comercios c ON c.usuario_id = u.id
             LEFT JOIN repartidores r ON r.usuario_id = u.id
             WHERE u.email = $1`,
            [email]
        );
        if (resultado.rows.length === 0) {
            return null;
        }
        const fila = resultado.rows[0];
        return {
            id: fila.id,
            email: fila.email,
            passwordHash: fila.password_hash,
            rol: fila.rol,
            comercioId: fila.comercio_id,
            repartidorId: fila.repartidor_id,
        };
    }
}

module.exports = UsuarioRepositorio;
