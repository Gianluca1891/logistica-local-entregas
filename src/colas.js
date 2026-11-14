const conexion = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
};

const COLA_CALCULAR_RUTA = 'calcular-ruta';
const COLA_RUTA_CALCULADA = 'ruta-calculada';

module.exports = { conexion, COLA_CALCULAR_RUTA, COLA_RUTA_CALCULADA };
