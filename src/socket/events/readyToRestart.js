import { findRoomByCode } from "../functions/room.js"


export function handleReadyToRestart(socket, io) {
    socket.on("game:readyToRestart", ({ roomCode }) => {
        const room = findRoomByCode(roomCode)
        if (!room) {
            return socket.emit("game:error", "Sala no encontrada")
        }

        // Guardamos los IDs de los clientes que dieron clic al boton de "jugar otra vez"
        if (!room.playersReady.includes(socket.id)) {
            room.playersReady.push(socket.id)
        }

        if (room.playersReady.length === 2) {
            room.players.forEach(p => {
                const rival = room.players.find(r => r.id !== p.id)
                io.to(roomCode).emit("game:init", {
                    rival,
                    you: p
                })

                if (room.host === p.id) {
                    io.to(p.id).emit("game:host")
                }
            })
        }
    })
}