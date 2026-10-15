const Pedido = require("../../src/dominio/Pedido");

function crearPedido() {
    return new Pedido({
        id: 1,
        comercioId: 1,
        nombreCliente: "Ana",
        contactoCliente: "1122334455",
        direccionDestino: "Av. Siempre Viva 742",
        latitudDestino: -34.6,
        longitudDestino: -58.4,
        token: "abc123",
    });
}

describe("Pedido",() => {
    test("tiene que nacer pendiente", () => {
        const pedido = crearPedido();
        expect(pedido.obtenerEstado()).toBe("pendiente");
        expect(pedido.estaPendiente()).toBe(true);
    });

    test("avanza por todos los estados en orden", () => {
        const pedido = crearPedido();
        pedido.marcarAsignado();
        expect(pedido.obtenerEstado()).toBe("asignado");
        pedido.marcarRetirado();
        expect(pedido.obtenerEstado()).toBe("retirado");
        pedido.marcarEntregado();
        expect(pedido.obtenerEstado()).toBe("entregado");
    });

    test("no puede saltear estados", () => {
        const pedido = crearPedido();
        expect(() => pedido.marcarEntregado()).toThrow("Transicion invalida");
        expect(pedido.obtenerEstado()).toBe("pendiente");
    });

    test("no puede entregarse dos veces", () => {
        const pedido = crearPedido();
        pedido.marcarAsignado();
        pedido.marcarRetirado();
        pedido.marcarEntregado();
        expect(() => pedido.marcarEntregado()).toThrow("Transicion invalida");
    });
});
