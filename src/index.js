const pool = require('./infraestructura/db');
const UnidadDeTrabajo = require('./infraestructura/UnidadDeTrabajo');
const PedidoRepositorio = require('./infraestructura/PedidoRepositorio');
const CrearPedido = require('./aplicacion/CrearPedido');
const crearApp = require('./api/app');

const unidadDeTrabajo = new UnidadDeTrabajo(pool);
const crearPedido = new CrearPedido({ unidadDeTrabajo });
const pedidos = new PedidoRepositorio(pool);
const app = crearApp({ crearPedido, pedidos });

const puerto = process.env.PORT || 3000;
app.listen(puerto, () => {
    console.log(`API escuchando en http://localhost:${puerto}`);
});
