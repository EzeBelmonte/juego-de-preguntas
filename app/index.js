const express = require('express');
// para crear el servidor
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs').promises;

const app = express();
// se crea el servidor HTTP
const server = http.createServer(app);
// se inicia Socket.IO sobre este servidor
const io = new Server(server);

// se importa las rutas desde routes/home.js
const rutas = require('./routes/home');

const archivoPreguntas = './data/preguntas.json';
// acá se guardan las preguntas
let preguntas = [];
// se define un array de 54 posiciones y en cada una de ellas se define otro array []
let preguntasCasillas = Array(54).fill().map(() => []);
let pregunta = null;

// se configura la carpeta pública
app.use(express.static(path.join(__dirname, '../public')));
// se usan las rutas definidas en el archivo externo home.js
app.use('/', rutas);

// guardamos los jugadores permanentemente una vez que hayan confirmados ambos jugadores
let jugadores = [];
// se guardan los datos de los jugadores temporalmente: id, nombre, puntaje
let jugadoresTemp = [];
// se guardan las confirmaciones de los 2 jugadores
let confirmaciones = [];
// controlar los turnos
let turno = 0;
// se guarda el puntaje de cada jugador y su posición
let jugadoresEstado = [
    { puntaje: 0, casilla: 0, numeroDado: null, ficha: null },
    { puntaje: 0, casilla: 0, numeroDado: null, ficha: null }
];

let pararTiempo = null;
let temporizador = null

// para saber cuando le dieron a reiniciar una vez terminada la partida
let finalizados = [];

// función principal para iniciar el servidor
async function iniciarServer() {
    try {
        // guardamos las preguntas en el arreglo
        const data = await fs.readFile(archivoPreguntas, 'utf-8');
        preguntas = JSON.parse(data);
        console.log(`Se cargaron ${preguntas.length} preguntas.`);

        // agrupar las preguntas por casilla
        preguntas.forEach((p, i) => {
            // i % 54 obtiene la posicion de cada casilla (0, 1, 2..53, 54). 
            // Cuando i pase a valer 54, los valores que devuelven otra vez son (0, 1, 2..53, 54)
            preguntasCasillas[i % 54].push(p);
        })

        // se manejan conexiones con socket.io
        io.on('connection', (socket) => {
            console.log('Un jugador se ha conectado', socket.id);

            // si ya estan los jugadoresTemp, no entra nadie mas
            if (jugadoresTemp.length >= 2) {
                console.log('Juego completo. Rechazando a:', socket.id);
                socket.emit('salaLlena');
                // se expulsa
                socket.disconnect(); 
                return;
            }

            // recibir el nombre desde el cliente
            socket.on('enviarNombre', (nombre) => {
                const yaExiste = jugadoresTemp.some(j => j.nombre.toLowerCase() === nombre.toLowerCase());
                if (yaExiste) {
                    socket.emit("nombreRepetido");
                    return;
                }

                const jugador = {
                    id: socket.id,
                    nombre,
                    puntaje: 0,
                };

                // se guarda al jugador
                jugadoresTemp.push(jugador);

                console.log(`Jugador agregado: ${nombre} (${socket.id})`);
                console.log('jugadoresTemp actuales:', jugadoresTemp.length);

                socket.emit('jugadorAceptado', jugador);

                // si ya hay 2 jugadoresTemp, se puede empezar
                if (jugadoresTemp.length === 2) {
                    console.log("los 2 jugadoresTemp están listos.");

                    // se avisa a ambos clientes
                    jugadoresTemp.forEach(j => {
                        io.to(j.id).emit('esperandoConfirmacion');
                    });
                }
            });

            socket.on('confirmado', () => {
                if (!confirmaciones.includes(socket.id)) {
                    confirmaciones.push(socket.id);
                }

                if (confirmaciones.length === 2) {
                    console.log("Ambos jugadoresTemp confirmaron. ¡Comienza el juego!");
                    jugadoresTemp.forEach( (j, i) => {
                        j.nro = i;
                        // como ya pasamos a la siguiente ventana, guardamos los jugadores permanentemente
                        jugadores.push(j);
                        io.to(j.id).emit('comenzarJuego');
                    });
                }
            });

            // al cambiar de ventana, el ID cambia, aca se actualiza
            socket.on('actualizarIDs', ( nombre ) => {
                const jugador = jugadores.find(j => j.nombre === nombre);
                if (jugador) {
                    jugador.id = socket.id;
                }
                console.log('id actualizado');

                jugadores.forEach(j => {
                    // a cada jugador se manda los datos propios y del otro
                    io.to(j.id).emit('actualizarDatos', { jugadores });
                });
            });


            // ====================== LÓGICA DE LA FICHA
            socket.on('fichaJugador', () => {
                jugadores.forEach( (j, i) => {
                    io.to(socket.id).emit('crearFicha', { 
                        jugador: j,
                        posicion: jugadoresEstado[i].casilla
                    });
                });
            });

            socket.on('agregarFicha', ({ ficha }) => {
                const jugador = jugadores.find(j => j.id === socket.id);

                if (!jugador || ficha.nro !== jugador.nro) return;

                // se guarda la ficha en el estado
                jugadoresEstado[jugador.nro].ficha = ficha;
            });


            // ====================== LÓGICA DEL JUEGO
            // se recibe quien hizo clic
            socket.on('turno', () => {
                // se guarda el jugador que le toca el turno
                const jugadorActual = jugadores[turno];
                
                // si no es el turno, no se hace nada
                if (socket.id !== jugadorActual.id) {
                    console.log(`No es el turno de ${socket.id}`);
                    return;
                }

                // se genera un número aleatorio para el dado
                const numero = Math.floor(Math.random() * 6) + 1;
                // guardamos el número para la pregunta
                jugadoresEstado[turno].numeroDado = numero;
                jugadoresEstado[turno].casilla += numero;

                // enviamos el número del dado a ambos
                jugadores.forEach(j => {
                    io.to(j.id).emit('recibirNumDado', { numero, nom: jugadorActual.nombre });
                });
            });

            socket.on('obtenerMovimiento', () => {
                // para devolver el nombre de quien hizo la pregunta
                const jugadorActual = jugadores[turno];

                // si no es el turno, no se hace nada
                if (socket.id !== jugadorActual.id) {
                    console.log(`No es el turno de ${socket.id}`);
                    return;
                }

                // se le resta 1 a num ya que las casiilas van de 1 a 20 y las preguntas de 0 a 19
                const numero = jugadoresEstado[turno].numeroDado;
                
                // validamos el número del dado
                if (typeof numero !== 'number' || isNaN(numero) || numero < 1 || numero > 6) {
                    console.log('Número de dado inválido:', numero);
                    return;
                }

                // posición anterior y nueva para mover la ficha
                const desde = jugadoresEstado[turno].casilla - numero;
                // se verifica si se llegó al final
                if (jugadoresEstado[turno].casilla > 54) {
                    jugadoresEstado[turno].casilla = 55;
                }
                const hasta = jugadoresEstado[turno].casilla;

                // le avisamos al cliente para mover la ficha
                jugadores.forEach(j => {
                    io.to(j.id).emit('moverFicha', {
                        jugador: jugadorActual,
                        desde,
                        hasta,
                        ficha: jugadoresEstado[jugadorActual.nro].ficha
                    });
                });
            });

            socket.on('obtenerPregunta', () => {
                const jugadorActual = jugadores[turno];
                if (socket.id !== jugadorActual.id) return;

                // si se llegó al final, se finaliza el juego e indica quien ganó
                if ( jugadoresEstado[turno].casilla > 54) {
                    jugadores.forEach(j => {
                        io.to(j.id).emit('juegoFinalizado', { 
                            nom: jugadorActual.nombre,
                            puntos: jugadoresEstado[turno].puntaje     
                        })
                    });
                }

                // obtenemos la pregunta
                const numCasilla = jugadoresEstado[turno].casilla;
                
                if (numCasilla > 54) return;

                // se obtiene el grupo de preguntas de esa casilla
                const grupo = preguntasCasillas[numCasilla - 1];
                // obtenemos la que esté disponible
                pregunta = grupo.find(p => p.available);

                // se verifica si hay pregunta
                if (pregunta) {
                    pregunta.available = false;
                }
                

                // a todos los jugadores se le muestra la pregunta y opciones
                jugadores.forEach(j => {
                    io.to(j.id).emit('devolverPregunta', {
                        pregunta: pregunta.question,
                        opciones: pregunta.options,
                        nom: jugadorActual.nombre // nombre del que puede responder
                    });
                });

                // empezar cronómetro
                pararTiempo = false;
                temporizador = setTimeout(() => {
                    if (pararTiempo) return;

                    obtenerRespuesta(3, false);
                }, 10000);
            });

            // se recibe del cliente el nombre de quien hizo clic y la opción
            socket.on('respuesta', ({ opcion }) => {
                // se detieneel tiempo si se recibe la respuesta
                clearTimeout(temporizador);
                temporizador = null;
                obtenerRespuesta(opcion, true);
            });

            function obtenerRespuesta(opcion, pararTiempo) {
                // se obtiene el jugador de quien es el turno
                const jugadorActual = jugadores[turno];

                // si el nombre no es de quién hizo la pregunta originalmente, salimos
                if (socket.id !== jugadorActual.id) return;

                // sumamos el número del dado mas la casilla actual
                const numCasilla = jugadoresEstado[turno].casilla;

                // obtenemos la pregunta
                //const pregunta = preguntas[numCasilla - 1];

                // se verifica si la respuesta es la correcta
                const esCorrecta = opcion === pregunta.correct; 

                // si es correcto, sumamos 1, sino pasamos de turno
                if (esCorrecta) {
                    jugadoresEstado[turno].puntaje += 1;
                    jugadorActual.puntaje = jugadoresEstado[turno].puntaje;
                } else {
                    // avanzar turno
                    turno = (turno + 1) % 2;
                    console.log(`[SERVER]: Cambio de turno = ${turno}`);
                }

                // se marca la respuesta correcta
                jugadores.forEach(j => {
                    io.to(j.id).emit('mostrarOpcionCorrecta', { 
                        correcta: esCorrecta,
                        nroPregunta: pregunta.correct,
                        opElegida: opcion,
                        detenerTiempo: pararTiempo
                    })
                });

                // actualizar puntajes en ambos clientes
                jugadores.forEach(j => {
                    io.to(j.id).emit('actualizarDatos', { jugadores });
                });
            }

            socket.on('reiniciandoJuego', () => {
                if (!finalizados.includes(socket.id)) {
                    finalizados.push(socket.id);
                }

                if (finalizados.length === 2) {
                    jugadoresEstado.forEach(j => {
                        j.casilla = 0;
                        j.puntaje = 0;
                        j.numeroDado = null;
                    })

                    jugadores.forEach(j => {
                        j.puntaje = 0;
                    })

                    jugadores.forEach(j => {
                        // a cada jugador se manda los datos propios y del otro
                        io.to(j.id).emit('reiniciar');
                    });
                    
                    // resetear
                    finalizados = [];
                }
            });


            // desconectar usuarios
            socket.on('disconnect', () => {
                console.log('Se desconectó: ', socket.id);
                
                // eliminar jugador si se desconecta
                jugadoresTemp = jugadoresTemp.filter(j => j.id !== socket.id);
                
                // eliminar las confirmaciones
                confirmaciones = confirmaciones.filter(id => id !== socket.id);

                console.log('Confirmaciones actuales:', confirmaciones);
                
                // obtenemos al usuario que quedó
                const idRestante = jugadoresTemp.find(j => j.id !== socket.id);

                // si quedó uno solo en las confirmaciones, es porque los 2 estaban listo pero uno se fue
                if (jugadoresTemp.length === 1) {
                    
                    console.log('El jugador que quedó confirmado es:', idRestante);

                    // al usuario que quedó se le manda "un paso atras"
                    io.to(idRestante.id).emit('pasoAnterior');
                }

                console.log('jugadoresTemp restantes: ', jugadoresTemp.length);
            });
        });

        // se levanta el servidor
        const PORT = 3000;
        server.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (err) {
        console.log("Error al cargar las preguntas:", err);
    }
}

// ejecutar el servidor
iniciarServer();
