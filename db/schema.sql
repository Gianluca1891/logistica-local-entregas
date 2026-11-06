-- Usuarios con cuenta: comercios y repartidores.
CREATE TABLE usuarios (
    id            SERIAL PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol           TEXT NOT NULL CHECK (rol IN ('comercio', 'repartidor'))
);

CREATE TABLE comercios (
    id         SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuarios (id),
    nombre     TEXT NOT NULL,
    direccion  TEXT NOT NULL,
    latitud    DOUBLE PRECISION NOT NULL,
    longitud   DOUBLE PRECISION NOT NULL
);

CREATE TABLE repartidores (
    id         SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuarios (id),
    nombre     TEXT NOT NULL,
    disponible BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE productos (
    id          SERIAL PRIMARY KEY,
    comercio_id INTEGER NOT NULL REFERENCES comercios (id),
    nombre      TEXT NOT NULL,
    stock       INTEGER NOT NULL CHECK (stock >= 0)
);

-- El cliente no tiene cuenta: sus datos se guardan en el pedido.
CREATE TABLE pedidos (
    id                SERIAL PRIMARY KEY,
    comercio_id       INTEGER NOT NULL REFERENCES comercios (id),
    cliente_nombre    TEXT NOT NULL,
    cliente_contacto  TEXT NOT NULL,
    direccion_destino TEXT NOT NULL,
    latitud_destino   DOUBLE PRECISION NOT NULL,
    longitud_destino  DOUBLE PRECISION NOT NULL,
    estado            TEXT NOT NULL DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente', 'asignado', 'retirado', 'entregado')),
    token             TEXT NOT NULL UNIQUE,
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pedido_items (
    id          SERIAL PRIMARY KEY,
    pedido_id   INTEGER NOT NULL REFERENCES pedidos (id),
    producto_id INTEGER NOT NULL REFERENCES productos (id),
    cantidad    INTEGER NOT NULL CHECK (cantidad > 0),
    UNIQUE (pedido_id, producto_id)
);

CREATE TABLE rutas (
    id            SERIAL PRIMARY KEY,
    comercio_id   INTEGER NOT NULL REFERENCES comercios (id),
    repartidor_id INTEGER NOT NULL REFERENCES repartidores (id),
    solicitud_id  TEXT NOT NULL UNIQUE,
    estado        TEXT NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente', 'lista', 'en_curso', 'finalizada'))
);

-- Un repartidor no puede tener dos rutas activas a la vez.
CREATE UNIQUE INDEX una_ruta_activa_por_repartidor
    ON rutas (repartidor_id)
    WHERE estado <> 'finalizada';

CREATE TABLE ruta_pedidos (
    ruta_id   INTEGER NOT NULL REFERENCES rutas (id),
    pedido_id INTEGER NOT NULL UNIQUE REFERENCES pedidos (id),
    orden     INTEGER CHECK (orden > 0),
    PRIMARY KEY (ruta_id, pedido_id),
    UNIQUE (ruta_id, orden)
);

CREATE TABLE posiciones (
    id            SERIAL PRIMARY KEY,
    ruta_id       INTEGER NOT NULL REFERENCES rutas (id),
    latitud       DOUBLE PRECISION NOT NULL CHECK (latitud BETWEEN -90 AND 90),
    longitud      DOUBLE PRECISION NOT NULL CHECK (longitud BETWEEN -180 AND 180),
    registrado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);