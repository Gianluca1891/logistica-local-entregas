const RADIO_TIERRA_KM = 6371;

function aRadianes(grados) {
    return (grados * Math.PI) / 180;
}

function distanciaKm(a, b) {
    const dLat = aRadianes(b.latitud - a.latitud);
    const dLon = aRadianes(b.longitud - a.longitud);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(aRadianes(a.latitud)) * Math.cos(aRadianes(b.latitud)) * Math.sin(dLon / 2) ** 2;
    return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
}

function calcularRuta(origen, paradas) {
    const pendientes = [...paradas];
    const orden = [];
    let actual = origen;

    while (pendientes.length > 0) {
        let masCercana = 0;
        for (let i = 1; i < pendientes.length; i++) {
            if (distanciaKm(actual, pendientes[i]) < distanciaKm(actual, pendientes[masCercana])) {
                masCercana = i;
            }
        }
        actual = pendientes.splice(masCercana, 1)[0];
        orden.push(actual.id);
    }
    return orden;
}

module.exports = { distanciaKm, calcularRuta };
