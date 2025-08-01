import { findRoomByCode } from "../functions/room.js";

export function handleTurn (socket, io) {
    socket.on("game:turn", ({ roomCode }) => {
        // Buscar la room con el mismo código
        const room = findRoomByCode(roomCode)
        if (!room) {
            return socket.emit("game:error", "Sala no encontrada")
        }

        // Validar que el índice de turno sea válido
        if (room.turn < 0 || room.turn >= room.players.length) {
            return socket.emit("game:error", "Índice de turno inválido");
        }
  
        // Se guarda el jugador que le toca el turno
        const player = room.players[room.turn];
        
        // Si no es el turno, no se hace nada
        if (socket.id !== player.id) {
            return;
        }

        // se genera un número aleatorio para el dado
        const number = Math.floor(Math.random() * 6) + 1
        // guardamos el número para la pregunta
        room.numberDie = number
        player.square += number

        // enviamos el número del dado a ambos
        io.to(roomCode).emit("game:receiveNumber", { number, id: player.id})
    });
}