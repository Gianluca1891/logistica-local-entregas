import { llamarApi, cerrarSesion, exigirRol } from './comun.js';

exigirRol('comercio');

const tabla = document.getElementById('pedidos');
const error = document.getElementById('error');
const contenedorRutas = document.getElementById('rutas');
const errorRuta = document.getElementById('error-ruta');
const mensajeRuta = document.getElementById('mensaje-ruta');
const botonSolicitar = document.getElementById('solicitar');

document.getElementById('salir').addEventListener('click', cerrarSesion);
document.getElementById('actualizar').addEventListener('click', cargarTodo);

function fila(valores) {
    const tr = document.createElement('tr');
    for (const valor of valores) {
        const td = document.createElement('td');
        td.textContent = valor;
        tr.appendChild(td);
    }
    return tr;
}

async function cargarPedidos() {
    try {
        const pedidos = await llamarApi('GET', '/comercio/pedidos');
        tabla.replaceChildren(
            ...pedidos.map((p) =>
                fila([p.id, p.nombreCliente, p.contactoCliente, p.direccionDestino, p.estado])
            )
        );
        error.textContent = pedidos.length === 0 ? 'Todavía no hay pedidos' : '';
    } catch (e) {
        error.textContent = e.message;
    }
}

function tarjetaDeRuta(ruta) {
    const div = document.createElement('div');
    const titulo = document.createElement('h3');
    titulo.textContent = `Ruta #${ruta.id} - ${ruta.repartidor} - ${ruta.estado}`;
    const lista = document.createElement('ol');
    for (const parada of ruta.paradas) {
        const item = document.createElement('li');
        const orden = parada.orden === null ? '(calculando orden...) ' : '';
        item.textContent = `${orden}${parada.nombreCliente} - ${parada.direccionDestino} (${parada.estado})`;
        lista.appendChild(item);
    }
    div.append(titulo, lista);
    return div;
}

async function cargarRutas() {
    try {
        const rutas = await llamarApi('GET', '/comercio/rutas');
        contenedorRutas.replaceChildren(...rutas.map(tarjetaDeRuta));
        errorRuta.textContent = '';
    } catch (e) {
        errorRuta.textContent = e.message;
    }
}

async function cargarTodo() {
    await Promise.all([cargarPedidos(), cargarRutas()]);
}

botonSolicitar.addEventListener('click', async () => {
    botonSolicitar.disabled = true;
    errorRuta.textContent = '';
    mensajeRuta.textContent = '';
    try {
        const ruta = await llamarApi('POST', '/comercio/rutas');
        mensajeRuta.textContent = `Ruta #${ruta.id} solicitada. Calculando el orden de entrega...`;
        await cargarTodo();
        setTimeout(cargarTodo, 2000);
    } catch (e) {
        errorRuta.textContent = e.message;
    } finally {
        botonSolicitar.disabled = false;
    }
});

cargarTodo();
