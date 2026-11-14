import { llamarApi, cerrarSesion, exigirRol } from './comun.js';

exigirRol('repartidor');

const error = document.getElementById('error');
const mensaje = document.getElementById('mensaje');
const titulo = document.getElementById('titulo');
const botonIniciar = document.getElementById('iniciar');
const listaParadas = document.getElementById('paradas');

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

async function cargarRuta() {
    try {
        const ruta = await llamarApi('GET', '/repartidor/ruta');
        error.textContent = '';
        if (!ruta) {
            titulo.textContent = 'Todavía no tenés una ruta asignada.';
            botonIniciar.hidden = true;
            listaParadas.replaceChildren();
            return;
        }
        titulo.textContent = `Ruta #${ruta.id} - ${ruta.estado}`;
        botonIniciar.hidden = ruta.estado !== 'lista';
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
