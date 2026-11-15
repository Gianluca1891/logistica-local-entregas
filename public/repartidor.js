import { llamarApi, cerrarSesion, exigirRol } from './comun.js';

exigirRol('repartidor');

const error = document.getElementById('error');
const mensaje = document.getElementById('mensaje');
const titulo = document.getElementById('titulo');
const botonIniciar = document.getElementById('iniciar');
const listaParadas = document.getElementById('paradas');
const botonAvanzar = document.getElementById('avanzar');

let posicionActual = null;
let proximaParada = null;

document.getElementById('salir').addEventListener('click', cerrarSesion);
document.getElementById('actualizar').addEventListener('click', cargarRuta);

function itemDeParada(parada, rutaEnCurso) {
    const item = document.createElement('li');
    item.textContent = `${parada.nombreCliente} - ${parada.direccionDestino} (${parada.estado}) `;
    if (rutaEnCurso && parada.estado === 'retirado') {
        const boton = document.createElement('button');
        boton.textContent = 'Entregar';
        boton.addEventListener('click', () => entregar(parada.pedidoId, boton));
        item.appendChild(boton);
    }
    return item;
}

function puntoSiguiente(desde, hasta) {
    const latitud = desde.latitud + (hasta.latitud - desde.latitud) / 2;
    const longitud = desde.longitud + (hasta.longitud - desde.longitud) / 2;
    const cerca = Math.abs(hasta.latitud - latitud) < 0.0005 && Math.abs(hasta.longitud - longitud) < 0.0005;
    return cerca ? { latitud: hasta.latitud, longitud: hasta.longitud } : { latitud, longitud };
}

botonAvanzar.addEventListener('click', async () => {
    botonAvanzar.disabled = true;
    error.textContent = '';
    try {
        posicionActual = await llamarApi('POST', '/repartidor/posicion', puntoSiguiente(posicionActual, proximaParada));
        const llegaste =
            posicionActual.latitud === proximaParada.latitud && posicionActual.longitud === proximaParada.longitud;
        mensaje.textContent = llegaste
            ? `Llegaste a ${proximaParada.direccionDestino}. Ya podés entregar.`
            : `Avanzando hacia ${proximaParada.direccionDestino}...`;
    } catch (e) {
        error.textContent = e.message;
    } finally {
        botonAvanzar.disabled = false;
    }
});

async function cargarRuta() {
    try {
        const ruta = await llamarApi('GET', '/repartidor/ruta');
        error.textContent = '';
        if (!ruta) {
            titulo.textContent = 'Todavía no tenés una ruta asignada.';
            botonIniciar.hidden = true;
            botonAvanzar.hidden = true;
            listaParadas.replaceChildren();
            return;
        }
        titulo.textContent = `Ruta #${ruta.id} - ${ruta.estado}`;
        botonIniciar.hidden = ruta.estado !== 'lista';
        posicionActual = ruta.posicion ?? ruta.origen;
        proximaParada = ruta.estado === 'en_curso' ? ruta.paradas.find((p) => p.estado === 'retirado') : null;
        botonAvanzar.hidden = !proximaParada;

        listaParadas.replaceChildren(...ruta.paradas.map((p) => itemDeParada(p, ruta.estado === 'en_curso')));
    } catch (e) {
        error.textContent = e.message;
    }
}

async function entregar(pedidoId, boton) {
    boton.disabled = true;
    error.textContent = '';
    try {
        const resultado = await llamarApi('POST', `/repartidor/pedidos/${pedidoId}/entregar`);
        mensaje.textContent = resultado.rutaFinalizada
            ? 'Entregaste el último pedido. ¡Ruta finalizada!'
            : `Pedido #${pedidoId} entregado.`;
    } catch (e) {
        error.textContent = e.message;
    }
    await cargarRuta();
}

botonIniciar.addEventListener('click', async () => {
    botonIniciar.disabled = true;
    error.textContent = '';
    try {
        await llamarApi('POST', '/repartidor/ruta/iniciar');
        mensaje.textContent = 'Ruta iniciada. ¡Buen viaje!';
    } catch (e) {
        error.textContent = e.message;
    } finally {
        botonIniciar.disabled = false;
    }
    await cargarRuta();
});

cargarRuta();
