
export function validateAnswer(room, option, id, io) {
    if (!room.question) {
        return;
    }

    // Obtener el jugador que está jugando
    const player = room.players[room.turn]

    // Se verifica si la respuesta es correcta
    const correct = option === room.question.correct; 

    // Si es correcto, sumamos 1, sino pasamos de turno
    if (correct) {
        player.points += 1;
    } else {
        // Avanzamos al siguiente turno
        room.turn = (room.turn + 1) % room.players.length;  // Asegúrate de que room.turn se actualice correctamente
    }

    // Se emite la respuesta correcta o incorrecta
    //room.players.forEach(() => {
        io.to(room.code).emit("game:correctOption", { 
            correct,
            numberCorrect: room.question.correct,
            option
        })
    //})

    const you = room.players.find(p => p.id === id)
    const oponente = room.players.find(p => p.id !== id)
    // Actualizamos los puntajes en ambos clientes
    io.to(room.code).emit("game:init", { rival: oponente, you });
}