import { llamarApi, cerrarSesion, exigirRol } from './comun.js';

exigirRol('comercio');

const tabla = document.getElementById('pedidos');
const error = document.getElementById('error');

document.getElementById('salir').addEventListener('click', cerrarSesion);

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

cargarPedidos();
