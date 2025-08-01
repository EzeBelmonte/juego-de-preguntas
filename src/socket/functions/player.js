
// Agregar usuario a la sala
export function addPlayerToRoom(room, socketId, nickname) {
    const fullRoom = room.players.length >= 2
    if (fullRoom) {
        return {
            success: false,
            type: "fullRoom",
            message: "La sala está llena."
        }
    }

    // Verificar si el nickname ya está en la sala
    const alreadyExists = room.players.some(p => p.nickname === nickname)
    if (alreadyExists) {
        return {
            success: false,
            type: "usedNick",
            message: "El nickname ya está en uso."
        }
    }

    room.players.push({
        id: socketId,
        nickname,
        number: 1,
        points: 0,
        square: 0
    })

    return { success: true }
}

// Agregar al usuario como listo
export function markPlayerReady(room, socketId) {
    if (!room.playersReady.some(p => p.id === socketId)){
        room.playersReady.push({ id: socketId })
        return { success: true }
    }
    return { success: false }
}

export function allPlayersReady(room) {
    return room.players.length === room.playersReady.length
}
