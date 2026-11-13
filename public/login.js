import { llamarApi, guardarSesion } from './comun.js';

const PAGINA_POR_ROL = {
    comercio: '/comercio.html',
    repartidor: '/repartidor.html',
};

const formulario = document.getElementById('login');
const error = document.getElementById('error');

formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const boton = formulario.querySelector('button');
    boton.disabled = true;
    error.textContent = '';

    try {
        const { token, rol } = await llamarApi('POST', '/login', {
            email: formulario.email.value,
            password: formulario.password.value,
        });
        guardarSesion(token, rol);
        location.href = PAGINA_POR_ROL[rol];
    } catch (e) {
        error.textContent = e.message;
        boton.disabled = false;
    }
});
