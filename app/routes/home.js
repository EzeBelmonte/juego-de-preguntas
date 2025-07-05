const express = require('express');
const path = require('path');

const router = express.Router();

// ruta principal (muestra el index.html)
router.get('/', (req,res) => {
    res.sendFile(path.join(__dirname, '../../views/index.html'));
});

// ruta del tablero
router.get('/juego', (req,res) => {
    res.sendFile(path.join(__dirname, '../../views/juego.html'));
});

module.exports = router;
