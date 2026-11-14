const { Queue, Worker } = require('bullmq');
const { conexion, COLA_CALCULAR_RUTA, COLA_RUTA_CALCULADA } = require('../colas');
const procesarTrabajo = require('./procesarTrabajo');

const resultados = new Queue(COLA_RUTA_CALCULADA, { connection: conexion });
const worker = new Worker(COLA_CALCULAR_RUTA, (trabajo) => procesarTrabajo(trabajo.data, resultados), {
    connection: conexion,
});

worker.on('completed', (trabajo, orden) => {
    console.log(`Ruta ${trabajo.data.rutaId} calculada: ${orden.join(' -> ')}`);
});
worker.on('failed', (trabajo, error) => {
    console.error(`Fallo el calculo de la ruta ${trabajo?.data?.rutaId}: ${error.message}`);
});
worker.on('error', (error) => console.error('Error en el worker:', error.code || error.message));
resultados.on('error', (error) => console.error('Error en la cola de resultados:', error.code || error.message));

console.log(`Servicio de rutas escuchando la cola "${COLA_CALCULAR_RUTA}"`);
