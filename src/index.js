const { Queue } = require('bullmq');
const { conexion, COLA_CALCULAR_RUTA } = require('./colas');
const pool = require('./infraestructura/db');
const UnidadDeTrabajo = require('./infraestructura/UnidadDeTrabajo');
const PedidoRepositorio = require('./infraestructura/PedidoRepositorio');
const UsuarioRepositorio = require('./infraestructura/UsuarioRepositorio');
const ProductoRepositorio = require('./infraestructura/ProductoRepositorio');
const CrearPedido = require('./aplicacion/CrearPedido');
const IniciarSesion = require('./aplicacion/IniciarSesion');
const SolicitarRuta = require('./aplicacion/SolicitarRuta');
const crearApp = require('./api/app');

const secreto = process.env.JWT_SECRETO || 'secreto-solo-para-desarrollo';
const unidadDeTrabajo = new UnidadDeTrabajo(pool);
const crearPedido = new CrearPedido({ unidadDeTrabajo });
const pedidos = new PedidoRepositorio(pool);
const productos = new ProductoRepositorio(pool);
const iniciarSesion = new IniciarSesion({ usuarios: new UsuarioRepositorio(pool), secreto });
const colaRutas = new Queue(COLA_CALCULAR_RUTA, { connection: { ...conexion, enableOfflineQueue: false } });
colaRutas.on('error', (error) => console.error('Error en la cola de rutas:', error.code || error.message));
const solicitarRuta = new SolicitarRuta({ unidadDeTrabajo, colaRutas });
const app = crearApp({ crearPedido, pedidos, productos, iniciarSesion, solicitarRuta, secreto });

const puerto = process.env.PORT || 3000;
app.listen(puerto, () => {
    console.log(`API escuchando en http://localhost:${puerto}`);
});
