let socket
//let socketInitialized = false 

export function initializeSocket(handlers = {}) {
    //if (socketInitialized) return
    //socketInitialized = true

    socket = io()

    if (handlers.onSystemError) {
        socket.on("systemError", ( data ) => {
            const { type, message } = data
            handlers.onSystemError( type, message )
        })
    }

    /* ===== LOBBY ===== */
    if (handlers.onReceiveCode) {
        socket.on("lobby:receiveCode", (code) => {
            handlers.onReceiveCode(code)
        })
    }

    if (handlers.onWaitPlayer) {
        socket.on("lobby:waitPlayer", ( players ) => {
            handlers.onWaitPlayer( players )
        })
    }

    if (handlers.onExitLobby) {
        socket.on("lobby:exitLobby", ( code ) => {
            handlers.onExitLobby( code )
        })
    }

    /* ===== GAMEMANAGER ===== */
    if (handlers.onInit) {
        socket.on("game:init", ( data ) => {
            const { rival, you } = data
            handlers.onInit( rival, you )
        })
    }

    if (handlers.onHost) {
        socket.on("game:host", handlers.onHost)
    }

    if (handlers.onCreatePiece) {
        socket.on("game:createPiece", ( data ) => {
            const { playerNumber, position } = data
            handlers.onCreatePiece( playerNumber, position )
        })
    }

    if (handlers.onStart) {
        socket.on("game:start", handlers.onStart)
    }

    if (handlers.onReceiveNumber) {
        socket.on("game:receiveNumber", ( data ) => {
            const { number, id } = data
            handlers.onReceiveNumber( number, id )
        })
    }

    if (handlers.onMovePiece) {
        socket.on("game:movePiece", ( data ) => {
            const { playerNumber, from, to, id } = data
            console.log("Recibido evento game:movePiece ---- ACA");
            handlers.onMovePiece( playerNumber, from, to, id )
        })
    }

    if (handlers.onReturnQuestion) {
        socket.on("game:returnQuestion", ( data ) => {
            const { question, options, id } = data
            handlers.onReturnQuestion( question, options, id )
        })
    }

    if (handlers.onCorrectOption) {
        socket.on("game:correctOption", ( data ) => {
            const { correct, numberCorrect, option } = data
            handlers.onCorrectOption( correct, numberCorrect, option )
        })
    }

    if (handlers.onGameOver) {
        socket.on("game:gameOver", ( data ) => {
            const { nickname, points } = data
            handlers.onGameOver( nickname, points )
        })
    }

    if (handlers.onReset) {
        socket.on("game:reset", handlers.onReset)
    }
}

// Para exportar socket
export function getSocket() {
    return socket
}

/* ===== EMIT FUNCTIONS ===== */
export const emits = {
    /* ===== LOBBY ===== */
    emitCreateRoom({ nickname }) {
        socket.emit("lobby:createRoom", { nickname })
    },

    emitJoinRoom({ nickname, code }) {
        socket.emit("lobby:joinRoom", { nickname, code })
    },

    emitReady() {
        socket.emit("lobby:ready")
    },

    emitGoRoom() {
        socket.emit("lobby:goRoom")
    },

    /* ===== GAMEMANAGER ===== */
    emitPlayerPiece( roomCode ) {
        socket.emit("game:playerPiece", { roomCode })
    },

    emitPlayerPieceRender( roomCode ) {
        socket.emit("game:playerPieceRender", { roomCode })
    },

    emitTurn( roomCode ) {
        socket.emit("game:turn", { roomCode })
    },

    emitGetMovement( roomCode ) {
        socket.emit('game:getMovement', { roomCode });
    },

    emitGetQuestion( roomCode ) {
        socket.emit('game:getQuestion', { roomCode })
    },

    emitGetAnswer( roomCode, option ) {
        socket.emit("game:getAnswer", { roomCode, option })
    },

    emitResetting( roomCode ) {
        socket.emit("game:resetting", { roomCode })
    },
    
    emitReadyToRestart( roomCode ) {
        socket.emit("game:readyToRestart", { roomCode })
    }
}

/* ===== ON FUNCTIONS ===== */
export const listeners = {
    /* ===== LOBBY ===== */
    onStartGame(callback) {
        socket.once("lobby:startGame", callback)
    },

    onWait(callback) {
        socket.once("lobby:wait", callback)
    }

    /* ===== GAMEMANAGER ===== */
}