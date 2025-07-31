import { findRoomByPlayerId } from "../functions/room.js"

export function handleGoRoom(socket, io) {
    socket.on("lobby:goRoom", () => {
        const room = findRoomByPlayerId(socket.id)
        if (!room) return emitError(socket, "room_not_found", "Sala no encontrada")
        
        if (room) room.gameStarted = true

        io.to(room.code).emit("lobby:exitLobby", (room.code))
    })
}