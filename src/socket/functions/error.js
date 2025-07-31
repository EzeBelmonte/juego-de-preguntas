
export function emitError(socket, type, message) {
    socket.emit("systemError", { type, message })
}