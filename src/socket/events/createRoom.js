import { createRoom } from "../functions/room.js"
import { generateCode } from "../../utils/generateCode.js"
import { emitError } from "../functions/error.js"

export function handleCreateRoom(socket, existingCodes) {
    socket.on("lobby:createRoom", ({ nickname }) => {
        if (!nickname || nickname.trim() === "") {
            return emitError(socket, "invalidNickname", "El nickname no puede estar vacío.")
        }

        const code = generateCode(existingCodes)
        existingCodes.add(code)

        const room = createRoom(code, socket.id, nickname)
        socket.join(code)

        socket.emit("lobby:receiveCode", code)
        socket.emit("lobby:wait", room.players)
    })
}
