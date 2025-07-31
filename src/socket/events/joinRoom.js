import { findRoomByCode } from "../functions/room.js"
import { addPlayerToRoom } from "../functions/player.js"
import { emitError } from "../functions/error.js"

export function handleJoinRoom(socket, io) {
    socket.on("lobby:joinRoom", ({ nickname, code }) => {
        // Validación de nickname
        if (!nickname || typeof nickname !== "string" || nickname.trim() === "") {
            return emitError(socket, "invalidNickname", "El nickname no puede estar vacío.")
        }

        // Buscar la room con el mismo código
        const room = findRoomByCode(code)
        if (!room) {
            return emitError(socket, "invalidCode", "La sala no existe.")
        }

        // Si no se pudo agregar al usuario, se avisa que está llena la sala
        const result = addPlayerToRoom(room, socket.id, nickname) 
        if (!result.success) {
            return emitError(socket, result.type, result.message);
        }
        

        // Socket.IO Room
        socket.join(code)

        socket.emit("lobby:wait")
        // Se manda la lista de usuarios de la sala por cada usuario agregado
        io.to(code).emit("lobby:waitPlayer", room.players)
    })
}