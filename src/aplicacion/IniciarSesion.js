const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class IniciarSesion {
    constructor({ usuarios, secreto }) {
        this.usuarios = usuarios;
        this.secreto = secreto;
    }

    async ejecutar({ email, password }) {
        const usuario = await this.usuarios.buscarPorEmail(email);
        const valida = usuario !== null && (await bcrypt.compare(password, usuario.passwordHash));
        if (!valida) {
            throw new Error('Credenciales invalidas');
        }

        const datos = {
            usuarioId: usuario.id,
            rol: usuario.rol,
            comercioId: usuario.comercioId,
            repartidorId: usuario.repartidorId,
        };
        const token = jwt.sign(datos, this.secreto, { expiresIn: '8h' });
        return { token, rol: usuario.rol };
    }
}

module.exports = IniciarSesion;
