
import { handleReconnect } from "./events/reconnect.js"
import { handleDisconnect } from "./events/disconnect.js"
import { handlePlayerPiece } from "./events/playerPiece.js"
import { handleTurn } from "./events/turn.js"
import { hendleGetMovement } from "./events/getMovement.js"
import { handlePlayerPieceRender } from "./events/playerPieceRender.js"
import { handleGetQuestion } from "./events/getQuestion.js"
import { handleGetAnswer } from "./events/getAnswer.js"
import { handleResetting } from "./events/resetting.js"
import { handleReadyToRestart } from "./events/readyToRestart.js"

function gameManager(io) {

    io.on("connection", (socket) => {

        // Reconnectamos a los jugadores
        handleReconnect(socket, io)

        // Creamos la pieza del jugador
        handlePlayerPiece(socket, io)
        
        // Recibimos los clientes que renderizaron las fichas
        handlePlayerPieceRender(socket, io)
        
        // Obtenemos el numero del dado
        handleTurn(socket, io)

        // Enviamos la casilla a la que se tiene que mover
        hendleGetMovement(socket, io)

        // Obtenemos la pregunta
        handleGetQuestion(socket, io)

        // Validar respuesta
        handleGetAnswer(socket, io)

        // Enviamos al cliente para que reinicie
        handleResetting(socket, io)

        // Volvemos a emitr a INIT y HOST para volver a jugar
        handleReadyToRestart(socket, io)

        // Desconectamos al jugador
        handleDisconnect(socket, io)
    })

    // Muy importante devolver la instancia para que otros módulos la usen. Ej: game.js
    return io
}

export default gameManager