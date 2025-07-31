import { findRoomByCode } from "../functions/room.js";
import { validateAnswer } from "../functions/validateAnswer.js";

export function handleGetAnswer( socket, io ) {
    socket.on("game:getAnswer", ({ roomCode, option }) => {
        // Buscar la room con el mismo código
        const room = findRoomByCode(roomCode)
        if (!room) {
            return socket.emit("game:error", "Sala no encontrada")
        }

        // se detieneel tiempo si se recibe la respuesta
        const timer = room.timer
        clearTimeout(timer)
        room.timer = null
        validateAnswer(room, option, socket.id, io);
    })
}