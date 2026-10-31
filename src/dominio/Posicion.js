class Posicion {
    constructor({ rutaId, latitud, longitud, registradoEn = new Date() }) {
        this.rutaId = rutaId;
        this.latitud = latitud;
        this.longitud = longitud;
        this.registradoEn = registradoEn;
        this.validarCoordenadas();
    }

    validarCoordenadas() {
        const latitudValida = Number.isFinite(this.latitud) && this.latitud >= -90 && this.latitud <= 90;
        const longitudValida = Number.isFinite(this.longitud) && this.longitud >= -180 && this.longitud <= 180;
        if (!latitudValida || !longitudValida) {
            throw new Error('Coordenadas invalidas');
        }
    }
}

module.exports = Posicion;