import { findRoomByCode } from "../functions/room.js"
import { validateAnswer } from "../functions/validateAnswer.js";

export function handleGetQuestion(socket, io) {
    socket.on('game:getQuestion', ({ roomCode }) => {
        // Buscar la room con el mismo código
        const room = findRoomByCode(roomCode)
        if (!room) {
            return socket.emit("game:error", "Sala no encontrada")
        }

        // Se guarda el jugador que le toca el turno
        const player = room.players[room.turn]
        // Si no es el turno, no se hace nada
        if (socket.id !== player.id) {
            return
        }

        // si se llegó al final, se finaliza el juego e indica quien ganó
        if (player.square > 54) {
            room.players.forEach(() => {
                io.to(roomCode).emit('game:gameOver', { 
                    nickname: player.nickname,
                    points: player.points
                })
            })
            return;  // Termina la función después de emitir el fin del juego
        }

        // obtenemos la pregunta según el número de casilla
        if (player.square > 54) return

        // Se obtiene el grupo de preguntas de esa casilla
        const grupo = room.questionSquare[player.square - 1]
        // Se obtiene la pregunta disponible
        const pregunta = grupo.find(p => p.available)

        // Se verifica si hay pregunta
        if (pregunta) {
            pregunta.available = false

            // Se asigna a la sala
            room.question = pregunta
        }

        // Se muestra la pregunta y las opciones a todos los jugadores
        room.players.forEach(() => {
            io.to(roomCode).emit("game:returnQuestion", {
                question: room.question.question,
                options: room.question.options,
                id: player.id
            })
        })

        // Iniciar cronómetro con tiempo de 10 segundos
        if (!room.timer) {

            room.timer = setTimeout(() => {
                validateAnswer(room, 3, socket.id, io)
            }, 10000)
        }
    })
}
