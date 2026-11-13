const path = require("path");
const express = require("express");
const crearAutenticacion = require("./autenticacion");

const ERRORES_CONOCIDOS = {
    "Datos invalidos": 400,
    "El pedido debe tener al menos un producto": 400,
    "Producto repetido en el pedido": 400,
    "Producto inexistente": 400,
    "Todos los productos deben ser del mismo comercio": 400,
    "Cantidad invalida": 400,
    "Stock insuficiente": 400,
    "Credenciales invalidas": 401,
};

function leerPedido(body) {
    const datos = {
        comercioId: Number(body.comercioId),
        nombreCliente: body.nombreCliente,
        contactoCliente: body.contactoCliente,
        direccionDestino: body.direccionDestino,
        latitudDestino: Number(body.latitudDestino),
        longitudDestino: Number(body.longitudDestino),
        items: Array.isArray(body.items) ? body.items : [],
    };
    if (
        !Number.isInteger(datos.comercioId) ||
        !datos.nombreCliente ||
        !datos.contactoCliente ||
        !datos.direccionDestino ||
        !Number.isFinite(datos.latitudDestino) ||
        !Number.isFinite(datos.longitudDestino)
    ) {
        throw new Error("Datos invalidos");
    }
    datos.items = datos.items.map((item) => ({
        productoId: Number(item.productoId),
        cantidad: Number(item.cantidad),
    }));
    return datos;
}

function crearApp({ crearPedido, pedidos, productos, iniciarSesion, secreto } = {}) {
    const app = express();
    const requiereRol = crearAutenticacion(secreto);
    app.use(express.json());
    app.use(express.static(path.join(__dirname, "../../public")));

    app.get("/salud", (req, res) => {
        res.json({ estado: "ok" });
    });

    app.post("/login", async (req, res) => {
        const { email, password } = req.body ?? {};
        if (typeof email !== "string" || typeof password !== "string") {
            throw new Error("Datos invalidos");
        }
        res.json(await iniciarSesion.ejecutar({ email, password }));
    });

    app.post("/pedidos", async (req, res) => {
        const pedido = await crearPedido.ejecutar(leerPedido(req.body ?? {}));
        res.status(201).json({
            id: pedido.id,
            token: pedido.token,
            estado: pedido.obtenerEstado(),
        });
    });

    app.get("/productos", async (req, res) => {
        res.json(await productos.listarConComercio());
    });

    app.get("/pedidos/:token", async (req, res) => {
        const pedido = await pedidos.buscarPorToken(req.params.token);
        if (!pedido) {
            return res.status(404).json({ error: "Pedido no encontrado" });
        }
        res.json({
            id: pedido.id,
            estado: pedido.obtenerEstado(),
            direccionDestino: pedido.direccionDestino,
            latitudDestino: pedido.latitudDestino,
            longitudDestino: pedido.longitudDestino,
        });
    });

    app.get("/comercio/pedidos", requiereRol("comercio"), async (req, res) => {
        const lista = await pedidos.listarPorComercio(req.usuario.comercioId);
        res.json(
            lista.map((pedido) => ({
                id: pedido.id,
                estado: pedido.obtenerEstado(),
                nombreCliente: pedido.nombreCliente,
                contactoCliente: pedido.contactoCliente,
                direccionDestino: pedido.direccionDestino,
                latitudDestino: pedido.latitudDestino,
                longitudDestino: pedido.longitudDestino,
            }))
        );
    });

    app.use((error, req, res, next) => {
        if (res.headersSent) {
            return next(error);
        }
        if (error.type === "entity.parse.failed") {
            return res.status(400).json({ error: "JSON invalido" });
        }
        const status = ERRORES_CONOCIDOS[error.message];
        if (status) {
            return res.status(status).json({ error: error.message });
        }
        console.error(error);
        res.status(500).json({ error: "Error interno" });
    });

    return app;
}

module.exports = crearApp;
