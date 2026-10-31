const RutaPedido = require("../../src/dominio/RutaPedido");

describe("RutaPedido", () => {
    test("nace sin orden", () => {
        const rutaPedido = new RutaPedido({ pedidoId: 1 });
        expect(rutaPedido.orden).toBeNull();
    });

    test("fija un orden valido", () => {
        const rutaPedido = new RutaPedido({ pedidoId: 1 });
        rutaPedido.fijarOrden(2);
        expect(rutaPedido.orden).toBe(2);
    });

    test.each([0, -1, 1.5])("lanza error si el orden es %p", (orden) => {
        const rutaPedido = new RutaPedido({ pedidoId: 1 });
        expect(() => rutaPedido.fijarOrden(orden)).toThrow("Orden invalido");
        expect(rutaPedido.orden).toBeNull();
    });
});
