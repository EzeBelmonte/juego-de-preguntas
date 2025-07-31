import { promises as fs } from 'fs';

// Arreglo para todas las salas
const rooms = []

// Crear la sala con el host y se agrega a listos
export async function createRoom(code, hostSocketId, nickname) {
    const room = {
        code,
        players: [{
            id: hostSocketId,
            nickname,
            points: 0,
            square: 0
        }],
        numberDie: null, // Guardamos el número de dado de cada jugador cuando tira
        turn: 0, // Controla el turno del jugador
        timer: null, // Guardamos el temporizador de cada sala
        question: null, // Guardamos la pregunta seleccionada para el jugador
        questionSquare: Array(54).fill().map(() => []), // Estructura que guarda 2 preguntas por cada casilla
        playersReady: [hostSocketId], // Guardamos los jugadores que ponen listo en index.html
        playerFinished: [], // Guardamos los jugadores cuando se finaliza la partida
        playerRenderPiece: [], // Guardamos los jugadores listos para poder empezar la partida
        host: hostSocketId,
        gameStarted: false // Usado en main.js para saber si la desconexión fue por cambiar de html
    }

    // Cargamos las preguntas
    try {
        const archivoPreguntas = './data/preguntas.json';
        const data = await fs.readFile(archivoPreguntas, 'utf-8');
        const preguntas = JSON.parse(data);

        console.log(`Se cargaron las ${preguntas.length} preguntas`)
        // agrupar las preguntas por casilla
        preguntas.forEach((p, i) => {
            // i % 54 obtiene la posicion de cada casilla (0, 1, 2..53, 54). 
            // Cuando i pase a valer 54, los valores que devuelven otra vez son (0, 1, 2..53, 54)
            room.questionSquare[i % 54].push(p);
        })
    } catch (err) {
        throw new Error('No se pudo cargar el archivo de preguntas.');
    }
    
    // Agregamos la sala al arreglo de salas
    rooms.push(room)
    return room
}

// Buscamos la sala mediante el código
export function findRoomByCode(code) {
    return rooms.find(r => r.code === code)
}

// Buscar la sala mediante el id del jugador
export function findRoomByPlayerId(socketId) {
    return rooms.find(r => r.players.some(p => p.id === socketId))
}

// Eliminar la sala si el host no está
export function deleteRoom(code) {
    const index = rooms.findIndex(r => r.code === code)
    if (index !== -1) {
        rooms.splice(index, 1)
    }
}

// Eliminar un jugador de su sala
export function removePlayer(socketId) {
    for (const room of rooms) {
        const playerIndex = room.players.findIndex(p => p.id === socketId);
        if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1);
            room.playersReady = room.playersReady.filter(id => id !== socketId);

            if (room.players.length === 0 && !room.gameStarted) {
                deleteRoom(room.code)
            }
            break;
        }
    }
}

// Helper: obtener los socket.id de los jugadores de una sala
export function getPlayerIds(roomCode) {
    const room = findRoomByCode(roomCode);
    return room ? room.players.map(p => p.id) : []
}

// Cargamos las preguntas a la sala


export { rooms }