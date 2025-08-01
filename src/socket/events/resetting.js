import { findRoomByCode } from "../functions/room.js";

export function handleResetting( socket, io ) {
    socket.on("game:resetting", ({ roomCode }) => {
        const room = findRoomByCode(roomCode)
        if (!room) {
            return socket.emit("game:error", "Sala no encontrada")
        }

        if (!room.playerFinished.includes(socket.id)) {
            room.playerFinished.push(socket.id);
        }

        if (room.playerFinished.length === 2) {
            room.players.forEach(p => {
                p.points = 0,
                p.square = 0
            })

            room.numberDie = null
            room.timer = null
            room.question = null
            room.playerFinished = []
            room.playersReady = []

            room.questionSquare.forEach(grupo => {
                grupo.forEach(pregunta => {
                    pregunta.available = true
                })
            })


            room.players.forEach(p => {
                io.to(p.id).emit("game:reset")
            })
        }
    })
}