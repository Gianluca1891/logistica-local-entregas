const { Queue, Worker } = require('bullmq');
const { conexion, COLA_CALCULAR_RUTA, COLA_RUTA_CALCULADA } = require('./colas');
const pool = require('./infraestructura/db');
const UnidadDeTrabajo = require('./infraestructura/UnidadDeTrabajo');
const PedidoRepositorio = require('./infraestructura/PedidoRepositorio');
const UsuarioRepositorio = require('./infraestructura/UsuarioRepositorio');
const ProductoRepositorio = require('./infraestructura/ProductoRepositorio');
const RutaRepositorio = require('./infraestructura/RutaRepositorio');
const CrearPedido = require('./aplicacion/CrearPedido');
const IniciarSesion = require('./aplicacion/IniciarSesion');
const SolicitarRuta = require('./aplicacion/SolicitarRuta');
const AplicarOrdenDeRuta = require('./aplicacion/AplicarOrdenDeRuta');
const IniciarRuta = require('./aplicacion/IniciarRuta');
const EntregarPedido = require('./aplicacion/EntregarPedido');
const RegistrarPosicion = require('./aplicacion/RegistrarPosicion');
const crearApp = require('./api/app');
const crearTiempoReal = require('./api/tiempoReal');

const secreto = process.env.JWT_SECRETO || 'secreto-solo-para-desarrollo';
const unidadDeTrabajo = new UnidadDeTrabajo(pool);
const crearPedido = new CrearPedido({ unidadDeTrabajo });
const pedidos = new PedidoRepositorio(pool);
const productos = new ProductoRepositorio(pool);
const rutas = new RutaRepositorio(pool);
const iniciarSesion = new IniciarSesion({ usuarios: new UsuarioRepositorio(pool), secreto });
const colaRutas = new Queue(COLA_CALCULAR_RUTA, { connection: { ...conexion, enableOfflineQueue: false } });
colaRutas.on('error', (error) => console.error('Error en la cola de rutas:', error.code || error.message));
const solicitarRuta = new SolicitarRuta({ unidadDeTrabajo, colaRutas });
const aplicarOrden = new AplicarOrdenDeRuta({ unidadDeTrabajo });
const rutasCalculadas = new Worker(COLA_RUTA_CALCULADA, (trabajo) => aplicarOrden.ejecutar(trabajo.data), {
    connection: conexion,
});
rutasCalculadas.on('completed', (trabajo) => console.log(`Ruta ${trabajo.data.rutaId} lista`));
rutasCalculadas.on('failed', (trabajo, error) => console.error(`No se pudo guardar la ruta: ${error.message}`));
rutasCalculadas.on('error', (error) => console.error('Error en el worker de rutas:', error.code || error.message));
const iniciarRuta = new IniciarRuta({ unidadDeTrabajo });
const entregarPedido = new EntregarPedido({ unidadDeTrabajo });
const registrarPosicion = new RegistrarPosicion({ unidadDeTrabajo });
const tiempoReal = crearTiempoReal({ buscarSeguimiento: (token) => pedidos.buscarSeguimiento(token) });
const app = crearApp({
    crearPedido,
    pedidos,
    productos,
    rutas,
    iniciarSesion,
    solicitarRuta,
    iniciarRuta,
    entregarPedido,
    registrarPosicion,
    secreto,
    tiempoReal,
});

const puerto = process.env.PORT || 3000;
const servidor = app.listen(puerto, () => {
    console.log(`API escuchando en http://localhost:${puerto}`);
});
tiempoReal.adjuntar(servidor);
