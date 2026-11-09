const express = require('express');

function crearApp() {
    const app = express();
    app.use(express.json());

    app.get('/salud', (req, res) => {
        res.json({ estado: 'ok' });
    });

    return app;
}

module.exports = crearApp;
