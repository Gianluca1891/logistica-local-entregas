# Plataforma de logística y rutas de entrega para comercio local

Trabajo práctico de Técnicas Avanzadas de Programación.

- Los **clientes** hacen pedidos sin cuenta y los rastrean en vivo con un código.
- Los **comercios** ven sus pedidos y solicitan una ruta de entrega.
- Un **microservicio** calcula el orden de visita de forma asíncrona.
- Los **repartidores** recorren la ruta, reportan su posición y confirman cada entrega.

## Arquitectura

```
Navegador (HTML/CSS/JS + Leaflet)
   │  HTTP (REST)          WebSocket /ws
   ▼                          ▼
API Node.js + Express ──────────────► PostgreSQL
   │   ▲
   │   │  BullMQ sobre Redis
   ▼   │   cola "calcular-ruta" (API → microservicio)
Microservicio de rutas   cola "ruta-calculada" (microservicio → API)
(vecino más cercano + Haversine, no accede a la base)
```

- **Capas:** `dominio` (reglas de negocio) → `aplicacion` (casos de uso) → `infraestructura` (SQL, repositorios) → `api` (HTTP y WebSocket).
- **Inyección de dependencias:** `src/index.js` arma todos los objetos y se los pasa por constructor a los servicios. En los tests se reemplazan por dobles.
- **Transacciones:** `UnidadDeTrabajo` agrupa las operaciones; `SELECT ... FOR UPDATE` evita sobreventa y asignaciones dobles.
- **Tiempo real:** el cliente se suscribe por WebSocket con el código de su pedido y recibe los cambios de estado y la posición del repartidor mientras el pedido está en camino.

## Cómo levantarlo

Requisitos: **Docker Desktop** (abierto) y `make`. Para correr los tests: **Node.js 22**.

```bash
make build    # construye y levanta db, redis, api y servicio-rutas
make demo     # carga los datos de demo (y vacía la cola)
```

Abrir `http://localhost:3000`.

| Comando | Qué hace |
|---|---|
| `make build` | Levanta los 4 servicios con Docker Compose (`docker compose up -d --build`) |
| `make demo` | Recarga los datos de demo y vacía Redis |
| `make logs` | Muestra los logs de la API y del microservicio |
| `make down` | Baja los contenedores (los datos quedan guardados) |
| `make reset` | Borra la base y Redis y vuelve a levantar todo |
| `make shell` | Abre `psql` en la base |

## Cuentas de demo

Contraseña de todas: `demo1234`.

| Rol | Email |
|---|---|
| Comercio (Almacen Don Pepe) | `almacen@demo.com` |
| Comercio (Kiosco La Esquina) | `kiosco@demo.com` |
| Repartidor | `juan@demo.com` |
| Repartidor | `maria@demo.com` |

El cliente no tiene cuenta: entra con **Entrá como cliente** en la pantalla inicial. Hay 3 pedidos de demo para rastrear: `demo-pedido-1`, `demo-pedido-2` y `demo-pedido-3`.

## Tests

```bash
npm install
npm test                    # 120 unitarios
npm run test:integracion    # 26 de integración (necesita make build; vacía la base → después make demo)
npm run lint
```

El detalle de qué se probó, con qué datos y qué resultados dio está en [docs/PRUEBAS.md](docs/PRUEBAS.md). El guion de la demo está en [docs/DEMO.md](docs/DEMO.md).

## Endpoints

| Método | Ruta | Quién | Qué hace |
|---|---|---|---|
| POST | `/login` | Todos | Devuelve un JWT con el rol |
| GET | `/productos` | Público | Catálogo con su comercio |
| POST | `/pedidos` | Público | Crea un pedido y devuelve el código de seguimiento |
| GET | `/pedidos/:token` | Público | Estado y destino del pedido |
| GET | `/comercio/pedidos` | Comercio | Pedidos del comercio |
| POST | `/comercio/rutas` | Comercio | Solicita una ruta con los pedidos pendientes (202) |
| GET | `/comercio/rutas` | Comercio | Rutas del comercio con sus paradas |
| GET | `/repartidor/ruta` | Repartidor | Ruta activa del repartidor |
| POST | `/repartidor/ruta/iniciar` | Repartidor | Inicia la ruta (pedidos → retirado) |
| POST | `/repartidor/posicion` | Repartidor | Registra la posición y la publica en vivo |
| POST | `/repartidor/pedidos/:id/entregar` | Repartidor | Entrega un pedido; con el último, finaliza la ruta |
| GET | `/salud` | Público | Control de salud (lo usa Docker) |
| WS | `/ws` | Público con código | `{"tipo":"suscribir","token":"..."}` → estado y posiciones en vivo |

## Estructura

```
src/
  dominio/          Producto, Pedido, PedidoItem, Ruta, RutaPedido, Repartidor, Posicion
  aplicacion/       CrearPedido, IniciarSesion, SolicitarRuta, AplicarOrdenDeRuta,
                    IniciarRuta, EntregarPedido, RegistrarPosicion
  infraestructura/  repositorios PostgreSQL y UnidadDeTrabajo
  api/              Express (app.js), autenticación JWT y WebSocket (tiempoReal.js)
  servicio-rutas/   microservicio: calcularRuta (Haversine + vecino más cercano) y worker BullMQ
  index.js          punto de composición de la API
public/             páginas de inicio, cliente, comercio y repartidor
db/                 schema.sql y datos-demo.sql
tests/              unitarias/ e integracion/
```
