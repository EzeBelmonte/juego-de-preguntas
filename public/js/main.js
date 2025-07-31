// Funciones relacionadas al socket
import { initializeSocket, emits, listeners, getSocket } from "./socketManager.js";

// Funciones
import { showCode, joinRoom } from "./functions.js";

let nickname = null

const inputNickname = document.getElementById("nickname")
const btnCreate = document.getElementById("create-btn")
const btnJoin = document.getElementById("join-btn")

// Escuchamos el botón de "Crear sala"
btnCreate.addEventListener("click", () => {
    // Guardamos el nick del input
    nickname = inputNickname.value.trim()
    // Si hay un nick puesto
    if (nickname) {
        // Lo emitimos al servidor para que cree la sala
        emits.emitCreateRoom({ nickname })
    }
})

// Escuchar botón "Unirse"
btnJoin.addEventListener("click", () => {
    // Guardamos el nick del input
    nickname = inputNickname.value.trim()
    // Si hay un nick puesto
    if (nickname) {
        joinRoom(nickname)
    }
})


// Inicializamos los listeners de socket
initializeSocket({
    onSystemError: ( type, message ) => {
        window.location.href = "/"
        alert(message)
    },

    onReceiveCode: (code) => {
        showCode(nickname, code)
    },

    onWaitPlayer: (players) => {
        const nickList = document.getElementById("user-list")
        nickList.innerHTML = players.map(p => `<p>${p.nickname}</p>`).join("")
    },

    onExitLobby: (code) => {
        // Obtenemos la instancia
        const socket = getSocket()

        localStorage.setItem("roomCode", code);
        localStorage.setItem("playerId", socket.id);

        window.location.href = "/game"
    }
})


listeners.onStartGame(() => {
    const startBtn = document.getElementById("start-btn")
    if (startBtn) {
        startBtn.disabled = false
        startBtn.onclick = () => {
            emits.emitGoRoom()
        }
    }
})
