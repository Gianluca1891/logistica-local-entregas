/* global L */
import { llamarApi } from './comun.js';

const formPedido = document.getElementById('pedido');
const selectComercio = document.getElementById('comercio');
const tablaProductos = document.getElementById('productos');
const errorPedido = document.getElementById('error-pedido');
const resultado = document.getElementById('resultado');

const formRastreo = document.getElementById('rastreo');
const errorRastreo = document.getElementById('error-rastreo');
const estado = document.getElementById('estado');
const enVivo = document.getElementById('en-vivo');
const contenedorMapa = document.getElementById('mapa');
const actualizado = document.getElementById('actualizado');

let productos = [];
let pedidoSeguido = null;
let socket = null;
let mapa = null;
let marcadorDestino = null;
let marcadorRepartidor = null;

function mostrarProductos() {
    const comercioId = Number(selectComercio.value);
    const filas = productos
        .filter((p) => p.comercioId === comercioId)
        .map((p) => {
            const tr = document.createElement('tr');
            const nombre = document.createElement('td');
            nombre.textContent = p.nombre;
            const stock = document.createElement('td');
            stock.textContent = p.stock;
            const cantidad = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.value = '0';
            input.dataset.productoId = p.id;
            cantidad.appendChild(input);
            tr.append(nombre, stock, cantidad);
            return tr;
        });
    tablaProductos.replaceChildren(...filas);
}

async function cargarProductos() {
    try {
        productos = await llamarApi('GET', '/productos');
        const elegido = selectComercio.value;
        const comercios = new Map(productos.map((p) => [p.comercioId, p.comercioNombre]));
        selectComercio.replaceChildren(
            ...[...comercios].map(([id, nombre]) => new Option(nombre, id))
        );
        if (elegido) {
            selectComercio.value = elegido;
        }
        mostrarProductos();
    } catch (e) {
        errorPedido.textContent = e.message;
    }
}

selectComercio.addEventListener('change', mostrarProductos);

formPedido.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const boton = formPedido.querySelector('button');
    boton.disabled = true;
    errorPedido.textContent = '';
    resultado.textContent = '';

    const items = [...tablaProductos.querySelectorAll('input')]
        .filter((input) => input.value !== '' && Number(input.value) !== 0)
        .map((input) => ({ productoId: input.dataset.productoId, cantidad: input.value }));

    try {
        const pedido = await llamarApi('POST', '/pedidos', {
            comercioId: selectComercio.value,
            nombreCliente: formPedido.nombreCliente.value,
            contactoCliente: formPedido.contactoCliente.value,
            direccionDestino: formPedido.direccionDestino.value,
            latitudDestino: formPedido.latitudDestino.value,
            longitudDestino: formPedido.longitudDestino.value,
            items,
        });
        resultado.textContent = `Pedido #${pedido.id} creado. Tu código de seguimiento es: ${pedido.token}`;
        formRastreo.token.value = pedido.token;
        await cargarProductos();
    } catch (e) {
        errorPedido.textContent = e.message;
    } finally {
        boton.disabled = false;
    }
});

function mostrarSeguimiento() {
    estado.textContent = `Pedido #${pedidoSeguido.pedidoId}: ${pedidoSeguido.estado} (entrega en ${pedidoSeguido.direccionDestino})`;
}

function mostrarRepartidor() {
    if (!mapa) {
        return;
    }
    const posicion = pedidoSeguido.estado === 'entregado' ? null : pedidoSeguido.posicion;
    if (!posicion) {
        marcadorRepartidor?.remove();
        marcadorRepartidor = null;
        actualizado.textContent = '';
        return;
    }
    actualizado.textContent = `Última ubicación del repartidor: ${new Date(posicion.registradoEn).toLocaleTimeString()}`;
    const punto = [posicion.latitud, posicion.longitud];
    if (marcadorRepartidor) {
        marcadorRepartidor.setLatLng(punto);
    } else {
        marcadorRepartidor = L.circleMarker(punto, { radius: 9, color: '#b00020' }).addTo(mapa).bindTooltip('Repartidor');
    }
}

function mostrarMapa() {
    if (!window.L) {
        return;
    }
    const destino = [pedidoSeguido.latitudDestino, pedidoSeguido.longitudDestino];
    contenedorMapa.hidden = false;
    if (!mapa) {
        mapa = L.map(contenedorMapa);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap',
        }).addTo(mapa);
        marcadorDestino = L.marker(destino).addTo(mapa).bindTooltip('Tu dirección');
    }
    marcadorDestino.setLatLng(destino);
    mapa.setView(destino, 14);
    mostrarRepartidor();
}

function alRecibirMensaje(evento) {
    const mensaje = JSON.parse(evento.data);
    if (mensaje.tipo === 'seguimiento') {
        pedidoSeguido = mensaje;
        mostrarSeguimiento();
        mostrarMapa();
    } else if (mensaje.tipo === 'estado' && pedidoSeguido) {
        pedidoSeguido.estado = mensaje.estado;
        mostrarSeguimiento();
        mostrarRepartidor();
    } else if (mensaje.tipo === 'posicion' && pedidoSeguido) {
        pedidoSeguido.posicion = mensaje;
        mostrarRepartidor();
    } else if (mensaje.tipo === 'error') {
        errorRastreo.textContent = mensaje.error;
    }
}

function conectar(token) {
    const protocolo = location.protocol === 'https:' ? 'wss' : 'ws';
    const nuevo = new WebSocket(`${protocolo}://${location.host}/ws`);
    socket = nuevo;
    nuevo.addEventListener('open', () => {
        enVivo.textContent = '🟢 Siguiendo en vivo';
        nuevo.send(JSON.stringify({ tipo: 'suscribir', token }));
    });
    nuevo.addEventListener('message', alRecibirMensaje);
    nuevo.addEventListener('close', () => {
        if (socket !== nuevo || pedidoSeguido?.estado === 'entregado') {
            return;
        }
        enVivo.textContent = '🔴 Conexión perdida, reconectando...';
        setTimeout(() => {
            if (socket === nuevo) {
                conectar(token);
            }
        }, 2000);
    });
}

function seguir(token) {
    const anterior = socket;
    socket = null;
    anterior?.close();
    pedidoSeguido = null;
    conectar(token);
}

formRastreo.addEventListener('submit', (evento) => {
    evento.preventDefault();
    errorRastreo.textContent = '';
    estado.textContent = '';
    const token = formRastreo.token.value.trim();
    if (token) {
        seguir(token);
    }
});

cargarProductos();
