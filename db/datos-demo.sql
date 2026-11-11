-- Datos de demo: se pueden recargar en cualquier momento con "make demo".
-- Contraseña de todos los usuarios: demo1234
\set ON_ERROR_STOP on
\set hash '$2b$10$V1tyFyY3jV.dD.gW7YxqkeYSMWMuU46AHCY.Nb6zSjrJtNqTqbf8u'

BEGIN;

TRUNCATE usuarios, comercios, repartidores, productos, pedidos,
         pedido_items, rutas, ruta_pedidos, posiciones
    RESTART IDENTITY CASCADE;

INSERT INTO usuarios (email, password_hash, rol) VALUES
    ('almacen@demo.com', :'hash', 'comercio'),
    ('kiosco@demo.com',  :'hash', 'comercio'),
    ('juan@demo.com',    :'hash', 'repartidor'),
    ('maria@demo.com',   :'hash', 'repartidor');

INSERT INTO comercios (usuario_id, nombre, direccion, latitud, longitud) VALUES
    (1, 'Almacen Don Pepe', 'Av. Santa Fe 3200', -34.5884, -58.4106),
    (2, 'Kiosco La Esquina', 'Av. Cordoba 5000', -34.5928, -58.4334);

INSERT INTO repartidores (usuario_id, nombre) VALUES
    (3, 'Juan'),
    (4, 'Maria');

INSERT INTO productos (comercio_id, nombre, stock) VALUES
    (1, 'Yerba', 20),
    (1, 'Galletitas', 15),
    (1, 'Leche', 10),
    (1, 'Dulce de leche', 1),
    (2, 'Gaseosa', 30),
    (2, 'Alfajor', 50);

INSERT INTO pedidos (comercio_id, cliente_nombre, cliente_contacto, direccion_destino,
                     latitud_destino, longitud_destino, token) VALUES
    (1, 'Ana',    '1111111111', 'Thames 1600',       -34.5872, -58.4297, 'demo-pedido-1'),
    (1, 'Bruno',  '2222222222', 'Av. Las Heras 3000', -34.5826, -58.4021, 'demo-pedido-2'),
    (1, 'Carla',  '3333333333', 'Gurruchaga 2000',   -34.5853, -58.4248, 'demo-pedido-3');

INSERT INTO pedido_items (pedido_id, producto_id, cantidad) VALUES
    (1, 1, 2),
    (2, 2, 1),
    (2, 3, 2),
    (3, 1, 1);

COMMIT;
