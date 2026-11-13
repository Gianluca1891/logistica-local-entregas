export async function llamarApi(metodo, url, cuerpo) {
    const opciones = { method: metodo, headers: {} };
    const token = localStorage.getItem('token');
    if (token) {
        opciones.headers.Authorization = `Bearer ${token}`;
    }
    if (cuerpo !== undefined) {
        opciones.headers['Content-Type'] = 'application/json';
        opciones.body = JSON.stringify(cuerpo);
    }

    let respuesta;
    try {
        respuesta = await fetch(url, opciones);
    } catch {
        throw new Error('No se pudo conectar con el servidor');
    }

    const datos = await respuesta.json().catch(() => ({}));
    if (respuesta.status === 401 && url !== '/login') {
        cerrarSesion();
    }
    if (!respuesta.ok) {
        throw new Error(datos.error || 'Error inesperado');
    }
    return datos;
}

export function guardarSesion(token, rol) {
    localStorage.setItem('token', token);
    localStorage.setItem('rol', rol);
}

export function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    location.href = '/';
}

export function exigirRol(rol) {
    if (localStorage.getItem('rol') !== rol) {
        location.href = '/';
    }
}
