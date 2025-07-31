import { findRoomByCode } from "../functions/room.js";

export function handlePlayerPieceRender(socket, io) {
    socket.on("game:playerPieceRender", ({ roomCode }) => {
        const room = findRoomByCode(roomCode)
    
        if (!room) {
            return socket.emit("game:error", "Sala no encontrada")
        }

        // Si no estaba renderizado ya, lo agregamos
        if (!room.playerRenderPiece.includes(socket.id)) {
            room.playerRenderPiece.push(socket.id);
        }

        if (room.playerRenderPiece.length === 2) {
            io.to(roomCode).emit("game:start")
        }
    })
}