// Funciones
import { handleCreateRoom } from "./events/createRoom.js"
import { handleJoinRoom } from "./events/joinRoom.js"
import { handleGoRoom } from "./events/goRoom.js"
import { handleReady } from "./events/ready.js"
import { handleDisconnect } from "./events/disconnect.js"


function socketSetup(io) {
    
    const existingCodes = new Set()

    io.on("connection", (socket) => {

        // Creamos la sala
        handleCreateRoom(socket, existingCodes)

        // Nos unimos a una sala mediante el código
        handleJoinRoom(socket, io)

        // Marcamos listo y si todos estan listos, se le avisa al host
        handleReady(socket, io)

        // Cuando el host empieza, se emite acá y vamos a game.html
        handleGoRoom(socket, io)

        // Desconectamos al jugador solo si no es que cambio de sala
        handleDisconnect(socket, io)

    })

    // Muy importante devolver la instancia para que otros módulos la usen. Ej: game.js
    return io
}

export default socketSetup