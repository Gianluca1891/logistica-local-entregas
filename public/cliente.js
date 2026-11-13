import { llamarApi } from './comun.js';

const formPedido = document.getElementById('pedido');
const selectComercio = document.getElementById('comercio');
const tablaProductos = document.getElementById('productos');
const errorPedido = document.getElementById('error-pedido');
const resultado = document.getElementById('resultado');

const formRastreo = document.getElementById('rastreo');
const errorRastreo = document.getElementById('error-rastreo');
const estado = document.getElementById('estado');

let productos = [];

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

formRastreo.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const boton = formRastreo.querySelector('button');
    boton.disabled = true;
    errorRastreo.textContent = '';
    estado.textContent = '';

    try {
        const token = encodeURIComponent(formRastreo.token.value.trim());
        const pedido = await llamarApi('GET', `/pedidos/${token}`);
        estado.textContent = `Pedido #${pedido.id}: ${pedido.estado} (entrega en ${pedido.direccionDestino})`;
    } catch (e) {
        errorRastreo.textContent = e.message;
    } finally {
        boton.disabled = false;
    }
});

cargarProductos();
