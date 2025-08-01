import { findRoomByCode } from "../functions/room.js";

export function handlePlayerPiece(socket, io) {
    socket.on('game:playerPiece', ({ roomCode }) => {

        // Buscar la room con el mismo código
        const room = findRoomByCode(roomCode)

        if (!room) {
            return socket.emit("game:error", "Sala no encontrada")
        }

        room.players.forEach(p => {
            io.to(roomCode).emit("game:createPiece", { 
                playerNumber: p.number,
                position: p.square
            });
        });
    });
}