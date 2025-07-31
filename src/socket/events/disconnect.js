import { findRoomByPlayerId, deleteRoom, removePlayer } from "../functions/room.js"

export function handleDisconnect(socket, io) {
    socket.on('disconnect', () => {

        // Buscar al usuario que se desconectó
        const room = findRoomByPlayerId(socket.id)
        if (!room) return

        // Si el que se desconectó era host, se elimina el room
        if (room.host === socket.id && !room.gameStarted) {
            io.to(room.code).emit("lobby:kicked", "El host cerró la sala.")
            deleteRoom(room.code)
        } else if (!room.gameStarted) {
            removePlayer(socket.id)
        
            // Se elimina de la sala de espera
            io.to(room.code).emit("lobby:wait", room.players);
        }
    })
}