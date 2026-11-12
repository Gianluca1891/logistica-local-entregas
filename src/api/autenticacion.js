const jwt = require('jsonwebtoken');

function crearAutenticacion(secreto) {
    return function requiereRol(rol) {
        return (req, res, next) => {
            const [tipo, token] = (req.headers.authorization ?? '').split(' ');
            if (tipo !== 'Bearer' || !token) {
                return res.status(401).json({ error: 'Token invalido' });
            }
            try {
                req.usuario = jwt.verify(token, secreto);
            } catch {
                return res.status(401).json({ error: 'Token invalido' });
            }
            if (req.usuario.rol !== rol) {
                return res.status(403).json({ error: 'Acceso denegado' });
            }
            next();
        };
    };
}

module.exports = crearAutenticacion;
