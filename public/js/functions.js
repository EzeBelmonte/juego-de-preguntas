import { emits, listeners } from "./socketManager.js"

export function showCode(nickname, code) {

    const lobby = document.getElementById("lobby")
    
    lobby.innerHTML = `
        <div class="user">
            <p>Código: <span class="code">${code}</span></p>
        </div>
        
        <div id="user-list" class="user-list">
            <p>${nickname}</p>
        </div>

        <button type="button" id="start-btn" class="button" disabled>Empezar</button>
    `
}

export function joinRoom(nickname, currentCode) {
    const lobby = document.getElementById("lobby")
    lobby.innerHTML = `
        <p class="text"><span>Nickname:</span> <span class="nick">${nickname}</span></p>

        <input type="text" id="join-code" class="input-code" placeholder="Ingresar código">

        <button type="button" id="join-btn" class="button">Ingresar</button>
    `

    document.getElementById("join-btn").onclick = () => {
        const code = document.getElementById("join-code").value.trim()
        if (code) {
            currentCode = code
            emits.emitJoinRoom({ nickname, code })
        }
    }

    listeners.onWait(() => {
        const lobby = document.getElementById("lobby")
        lobby.innerHTML = `
            <div class="user">
                <p>Código: <span class="code">${currentCode}</span></p>
            </div>

            <div id="user-list" class="user-list"></div>

            <button type="button" id="ready-btn" class="button">Listo</button>
        `

        const btnReady = document.getElementById("ready-btn")
        btnReady.onclick = () => {
            btnReady.disabled = true
            emits.emitReady()
        }
    })
}

// Renderizamos jugadores en las posiciones según la cantidad
export function renderPlayers(rival, you) {
    const jugador1 = document.getElementById(`jugador${you.number}`);
    jugador1.innerHTML = `
        <div id="card-${you.number}" class="jugador-n"><p>${you.nickname}</p></div>
        <div class="jugador-p"><p>${you.points}</p></div>
    `;

    const jugador2 = document.getElementById(`jugador${rival.number}`);
    jugador2.innerHTML = `
        <div class="jugador-p"><p>${rival.points}</p></div>
        <div id="card-${rival.number}" class="jugador-n"><p>${rival.nickname}</p></div> 
    `;

}

export function createPiece(playerNumber, position, roomCode) {
    // se crea el div para la ficha
    const ficha = document.createElement("div");
    // asignar ID a la ficha
    ficha.id = `ficha-jugador-${playerNumber}`;
    // le asignamos 2 clases
    ficha.className = `ficha jugador${playerNumber}`;

    // agregar la ficha dentro del contenedor del tablero
    const tablero = document.getElementById("tablero");
    tablero.appendChild(ficha);

    // se ve en que casilla debe aparecer la ficha. (Se tiene en cuenta en el caso de una re-conexión)
    const lugarCasilla = position === 0
    ? document.getElementById("casilla-inicio")
    : document.getElementById(`casilla-${position}`);

    // se obtiene las posiciones absolutas de la casilla y el tablero
    const casillaRect = lugarCasilla.getBoundingClientRect();
    const tableroRect = tablero.getBoundingClientRect();

    // se calcula la posición horizontal relativa de la ficha dentro del tablero y se le suma el desplazamiento (20)
    const offsetLeft = casillaRect.left - tableroRect.left + 20;
    ficha.style.left = `${offsetLeft}px`;
    
    // se guarda la posición vertical de cada ficha para que no se superpongan
    const baseTop = casillaRect.top - tableroRect.top;
    // depende de que jugador, es la posición vertical que va a recibir
    const extra = playerNumber === 0 ? 10 : 30;
    ficha.style.top = `${baseTop + extra}px`;

    // Emitimos al servidor que el cliente creo y renderizo las fichas
    emits.emitPlayerPieceRender(roomCode)
}

// función de la animación del dado
const dado = document.getElementById("dado");
const rotaciones = {
    1: { x: 0,   y: 0 },
    2: { x: 0,   y: 180 },
    3: { x: 0,   y: -90 },
    4: { x: 0,   y: 90 },
    5: { x: -90, y: 0 },
    6: { x: 90,  y: 0 }
};

export function rollDice(number) {
    if (number < 1 || number > 6) return;

    // Salto
    dado.style.top = "-30px";
    setTimeout(() => {
        dado.style.top = "0";
    }, 150);

    // Giro con vueltas extras
    const extraGiros = {
        x: 360 * (Math.floor(Math.random() * 2) + 3),
        y: 360 * (Math.floor(Math.random() * 2) + 3)
    };

    const destino = rotaciones[number];
    const rotX = destino.x + extraGiros.x;
    const rotY = destino.y + extraGiros.y;

    dado.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
}


// Movimiento de la ficha
const recorrido = [
        "inicio", 1, 2, 3, 4, 5, 6,
        7, 8, 9, 10, 11, 12, 13,
        14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32, 33, 34,
        35, 36, 37, 38, 39, 40, 41,
        42, 43, 44, 45, 46, 47, 48,
        49, 50, 51, 52, 53, 54, "final"
    ];

export function movePiece(playerNumber, from, to, id, youId, roomCode) {
    const ficha = document.getElementById(`ficha-jugador-${playerNumber}`);
    if (!ficha) return;

    // se guarda desde donde hay que moverse hasta donde moverse
    const idxDesde = recorrido.indexOf(from);
    let idxHasta = recorrido.indexOf(to);

    // si el valor 'hasta' no está en el array o se pasa del final, se le da el valor "final"
    if (idxHasta === -1 || idxHasta >= recorrido.length) {
        idxHasta = recorrido.indexOf("final");
    }

    // se guardan la cantidad de pasis que se tiene que dar
    const pasos = recorrido.slice(idxDesde + 1, idxHasta + 1);

    // representa cada paso
    let i = 0;

    const steps = () => {
        // cuando se llega al destino, se muestra la pregunta y se sale
        if (i >= pasos.length) {
            if (youId === id) {
                console.log("Entre una sola vez")
                emits.emitGetQuestion( roomCode );
            }
            return;
        }

        // se guarda el ID de la casilla
        const idCasilla = "casilla-" + pasos[i];

        // se obtiene la casilla y el tablero
        const casilla = document.getElementById(idCasilla);
        const tablero = document.getElementById("tablero");

        // si la casilla y el tablero existe
        if (casilla && tablero) {
            // se obtiene las posiciones absolutas en la pantalla de la casilla y el tablero
            const casillaRect = casilla.getBoundingClientRect();
            const tableroRect = tablero.getBoundingClientRect();

            // se calcula la posición horizontal y se le suma el desplazamiento de la ficha para que no se superponga
            const offsetLeft = casillaRect.left - tableroRect.left + 20;
            ficha.style.left = `${offsetLeft}px`;

            const baseTop = casillaRect.top - tableroRect.top;
            // separa las fichas para que no se superponga
            const extra = playerNumber === 0 ? 10 : 30;
                ficha.style.top    = `${baseTop + extra}px`;
                ficha.style.bottom = "";        
        }

        // siguiente paso
        i++;
        // cooldown para el siguiente paso (velocidad)
        setTimeout(steps, 200); 
    };

    steps();
}

// ===== Temporizador =====
let intervalo = null;
let seg = 9;
let mile = 100;
let isRunning = false;

export function startTimer() {
    if (isRunning) return; // evitar múltiples intervalos

    isRunning = true;

    const temporizador = document.getElementById('temporizador');
    temporizador.innerHTML = `
        <p class="tiempo-title">Tiempo restante</p>
        <p class="tiempo-reloj">
            <span id="seg">${seg.toString().padStart(2, '0')}</span>: 
            <span id="mile">${mile.toString().padStart(2, '0')}</span>
        </p>
    `;

    const milesimas = document.getElementById("mile");
    const segundos = document.getElementById("seg");

    intervalo = setInterval(() => {
        mile--;

        if (mile < 0) {
            mile = 99;
            seg--;
        }

        if (seg < 0) {
            clearInterval(intervalo);
            isRunning = false;

            milesimas.textContent = "00";
            segundos.textContent = "00";

            const reloj = document.querySelector(".tiempo-reloj");
            if (reloj) {
                reloj.style.fontSize = "2.8rem";
                setTimeout(() => {
                    reloj.style.fontSize = "2.5rem";
                }, 150);
            }

            return;
        }

        milesimas.textContent = mile.toString().padStart(2, '0');
        segundos.textContent = seg.toString().padStart(2, '0');
    }, 10);
}

export function stopTimer() {
    clearInterval(intervalo);
    isRunning = false;
}

export function resetTimer() {
    stopTimer();
    seg = 9;
    mile = 100;

    const segEl = document.getElementById("seg");
    const mileEl = document.getElementById("mile");
    if (segEl && mileEl) {
        segEl.textContent = seg.toString().padStart(2, '0');
        mileEl.textContent = mile.toString().padStart(2, '0');
    }
}

// ===== POPUP =====
export function showPopup(nickname,points,roomCode) {
        popup.style.display = "block"
        popup.innerHTML = `
            <div class="popup-contenido">
                <p>Ganó el jugador <span class="ganador">${nickname}</span></p>
                <p class="puntos">${points}</p>
                <p class="puntos-text">Puntos</p>
                <button id="cerrarPopup" class="btn-reiniciar">Jugar otra vez</button>
            </div>
        `;
        lanzarConfeti()
        // esperar que el DOM esté actualizado antes de agregar el listener
        setTimeout(() => {
            const btn = document.getElementById("cerrarPopup")
            if (btn) {
                btn.addEventListener('click', () => {
                    emits.emitResetting( roomCode )
                }, { once: true })
            }
        }, 0)
    }

    function lanzarConfeti() {
    confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
    })

// espera un poco y después ajustar el canvas para que quede al frente
setTimeout(() => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
        // para fijarlo
        canvas.style.position = 'fixed'
        // posicion del fijado
        canvas.style.top = 0
        canvas.style.left = 0
        // tamaño del canvas
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        // para que no se bloquee el botón de "jugar otra vez"
        canvas.style.pointerEvents = 'none'
        // para que aparezca al frente de todo
        canvas.style.zIndex = 9999
    }
}, 50) // pequeño delay para que el canvas se cree
}