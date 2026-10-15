class Repartidor {
    constructor({ id, nombre, disponible = true}){
        this.id = id;
        this.nombre = nombre;
        this.disponible = disponible;
    }

    ocupar(){
        if (this.disponible === false){
            throw new Error('Repartidor no disponible');
        }
        this.disponible = false;
    }

    liberar(){
        this.disponible = true;
    }

    estaDisponible(){
        return this.disponible;
    }

}


module.exports = Repartidor;