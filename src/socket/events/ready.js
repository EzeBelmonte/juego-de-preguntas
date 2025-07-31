import { findRoomByPlayerId } from "../functions/room.js"
import { markPlayerReady, allPlayersReady } from "../functions/player.js"

export function handleReady(socket, io) {
    socket.on("lobby:ready", () => {
        // Función que retorna la sala del jugador
        const room = findRoomByPlayerId(socket.id)
        if (!room) return emitError(socket, "room_not_found", "Sala no encontrada")

        // Marcamos al usuario como listo
        markPlayerReady(room, socket.id)
        io.to(room.code).emit("lobby:waitPlayer", room.players)

        if (allPlayersReady(room)) {
            io.to(room.host).emit("lobby:startGame")
        }
    })
}