const { calcularRuta } = require('./calcularRuta');

function esPunto(punto) {
    return Number.isFinite(punto?.latitud) && Number.isFinite(punto?.longitud);
}

async function procesarTrabajo(datos, resultados) {
    const { rutaId, solicitudId, origen, paradas } = datos;
    if (
        !solicitudId ||
        !esPunto(origen) ||
        !Array.isArray(paradas) ||
        paradas.length === 0 ||
        !paradas.every(esPunto)
    ) {
        throw new Error('Trabajo invalido');
    }

    const orden = calcularRuta(origen, paradas);
    await resultados.add(
        'resultado',
        { rutaId, orden },
        { jobId: `resultado-${solicitudId}`, attempts: 3, backoff: { type: 'fixed', delay: 1000 } }
    );
    return orden;
}

module.exports = procesarTrabajo;
