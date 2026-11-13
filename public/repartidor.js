import { cerrarSesion, exigirRol } from './comun.js';

exigirRol('repartidor');

document.getElementById('salir').addEventListener('click', cerrarSesion);
