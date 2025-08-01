import { findRoomByCode } from "../functions/room.js";

export function hendleGetMovement(socket, io) {
    socket.on("game:getMovement", ({ roomCode }) => {
        // Buscar la room con el mismo código
        const room = findRoomByCode(roomCode)
        if (!room) {
            return socket.emit("game:error", "Sala no encontrada")
        }
        
        // para devolver el nombre de quien hizo la pregunta
        const player = room.players[room.turn];

        // si no es el turno, no se hace nada
        if (socket.id !== player.id) {
            return;
        }

        const number = room.numberDie;
        
        // validamos el número del dado
        if (typeof number !== 'number' || isNaN(number) || number < 1 || number > 6) {
            return;
        }

        // posición anterior y nueva para mover la ficha
        const from = player.square - number;

        // se verifica si se llegó al final
        if (player.square > 54) {
            player.square = 55;
        }
        const to = player.square;

        // le avisamos al cliente para mover la ficha
        io.to(roomCode).emit("game:movePiece", {
            playerNumber: player.number,
            from,
            to,
            id: player.id
        })
    })
}