const pool = require('./infraestructura/db');
const UnidadDeTrabajo = require('./infraestructura/UnidadDeTrabajo');
const PedidoRepositorio = require('./infraestructura/PedidoRepositorio');
const UsuarioRepositorio = require('./infraestructura/UsuarioRepositorio');
const CrearPedido = require('./aplicacion/CrearPedido');
const IniciarSesion = require('./aplicacion/IniciarSesion');
const crearApp = require('./api/app');

const secreto = process.env.JWT_SECRETO || 'secreto-solo-para-desarrollo';
const unidadDeTrabajo = new UnidadDeTrabajo(pool);
const crearPedido = new CrearPedido({ unidadDeTrabajo });
const pedidos = new PedidoRepositorio(pool);
const iniciarSesion = new IniciarSesion({ usuarios: new UsuarioRepositorio(pool), secreto });
const app = crearApp({ crearPedido, pedidos, iniciarSesion, secreto });

const puerto = process.env.PORT || 3000;
app.listen(puerto, () => {
    console.log(`API escuchando en http://localhost:${puerto}`);
});
