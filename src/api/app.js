const express = require("express");

const ERRORES_DE_NEGOCIO = [
    "Datos invalidos",
    "El pedido debe tener al menos un producto",
    "Producto repetido en el pedido",
    "Producto inexistente",
    "Todos los productos deben ser del mismo comercio",
    "Cantidad invalida",
    "Stock insuficiente",
];

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

function crearApp({ crearPedido } = {}) {
    const app = express();
    app.use(express.json());

    app.get("/salud", (req, res) => {
        res.json({ estado: "ok" });
    });

    app.post("/pedidos", async (req, res) => {
        const pedido = await crearPedido.ejecutar(leerPedido(req.body));
        res
            .status(201)
            .json({
                id: pedido.id,
                token: pedido.token,
                estado: pedido.obtenerEstado(),
            });
    });

    app.use((error, req, res, next) => {
        if (res.headersSent) {
            return next(error);
        }
        if (error.type === "entity.parse.failed") {
            return res.status(400).json({ error: "JSON invalido" });
        }
        if (ERRORES_DE_NEGOCIO.includes(error.message)) {
            return res.status(400).json({ error: error.message });
        }
        console.error(error);
        res.status(500).json({ error: "Error interno" });
    });

    return app;
}

module.exports = crearApp;
