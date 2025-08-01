import { findRoomByCode } from "../functions/room.js"

export function handleReconnect(socket, io) {
    // Cuando el jugador se conecta desde game.html
    socket.on("game:reconnect", ({ roomCode, playerId }) => {

        const room = findRoomByCode(roomCode)

        if (!room) {
            return socket.emit("game:error", "Sala no encontrada")
        }

        // Actualizamos el socket.id del jugador que vuelve a entrar
        const player = room.players.find(p => p.id === playerId)
        if (player) {
            player.id = socket.id
        }

        // Si es el host, actualizamos también la variable "host" e indicamos que la sala ya paso la fase de comienzo
        if (room.host === playerId) {
            room.host = socket.id
            room.gameStarted = false
        }

        // Unimos al jugador a la sala Socket.IO (por si recarga la página)
        socket.join(roomCode)
        
        // Obtenemos al rival
        const oponent = room.players.find(p => p.id !== socket.id)
        //socket.emit("game:init", {
        io.to(roomCode).emit("game:init", {
            rival: oponent,
            you: player
        })

        if (room.host === socket.id) {
            socket.emit("game:host")
        }
    })
}