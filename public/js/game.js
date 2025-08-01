// Recuperamos los datos de localStorage en variables
const roomCode = localStorage.getItem("roomCode")
const playerId = localStorage.getItem("playerId")

import { initializeSocket, emits, getSocket } from "./socketManager.js"
import { renderPlayers, createPiece, rollDice, movePiece, startTimer, stopTimer, resetTimer, showPopup } from "./functions.js"


const tablero = document.getElementById("tablero")
const divPregunta = document.getElementById("pregunta");
const botonDado = document.getElementById('btn-dado')
const popup = document.getElementById("popup");

botonDado.classList.add("disabledDado")
botonDado.disabled = true


const ordenCasillas = [
    "inicio", 1, 2, 3, 4, 5, 6,
    13 ,12, 11, 10, 9, 8, 7,
    14, 15, 16, 17, 18, 19, 20,
    27, 26, 25, 24, 23, 22, 21,
    28, 29, 30, 31, 32, 33, 34,
    41, 40, 39, 38, 37, 36, 35,
    42, 43, 44, 45, 46, 47, 48,
    "final", 54, 53, 52, 51, 50, 49
];


// se crea el tablero con las casillas
ordenCasillas.forEach((valor, i) => {
    const div = document.createElement("div");

    // se le asigna la clase
    div.className = "casilla";
    // se le asigna un ID a cada casilla
    div.id = "casilla-" + valor;
    // se le asigna el valor que esta en "ordenCasillas"
    div.textContent = valor;

    // ocultamos las casillas ""
    if (valor === "") {
        div.classList.add("invisible");
    }

    // configurar casillas
    if (valor === "inicio") {
        div.classList.add('inicio');
    }
    if (valor === "final") {
        div.classList.add('final');
    }
    if (valor === 6 || valor === 20 || valor === 34 || valor === 48) {
        div.classList.add('casilla-curva-sup-der');
    }
    if (valor === 7 || valor === 21 || valor === 35 || valor === 49) {
        div.classList.add('casilla-curva-inf-der');
    }
    if (valor === 13 || valor === 27 || valor === 41) {
        div.classList.add('casilla-curva-sup-izq');
    }
    if (valor === 14 || valor === 28 || valor === 42) {
        div.classList.add('casilla-curva-inf-izq');
    }

    tablero.appendChild(div);
});


initializeSocket({
    onInit: ( rival, you ) => {

        localStorage.setItem('id', you.id);

        renderPlayers(rival,you)

        // se habilita el dado
        const botonDado = document.getElementById('btn-dado');
        botonDado.disabled = false;
    },

    onHost: () => {
        const div = document.createElement('div')
        div.innerHTML = `
            <div class="round-btn-container">
                <button id="round-btn" class="round-btn">Empezar ronda</button>
            </div>
`
        tablero.appendChild(div)

        const bntRound = document.getElementById("round-btn");
        if (bntRound) {
            bntRound.addEventListener("click", () => {
                emits.emitPlayerPiece( roomCode )
                // Una vez indicamos cuando iniciar mediante el botón, lo eliminamos
                div.remove()
            })
        }
    },

    onCreatePiece: ( playerNumber, position ) => {
        if (!document.getElementById(`ficha-jugador-${playerNumber}`)) {
            createPiece(playerNumber, position, roomCode);
        }
    },

    onStart: () => {
        const botonDado = document.getElementById('btn-dado');
        botonDado.classList.remove("disabledDado")
        botonDado.disabled = false
    },

    onReceiveNumber: ( number, id ) => {
        const botonDado = document.getElementById('btn-dado');
        botonDado.disabled = true;

        rollDice(number);
        
        divPregunta.innerHTML = '';
        document.getElementById('temporizador').innerHTML = `<p class="tiempo-default">Tiempo</p>`;

        //tiempo de espera para obtener la pregunta
        if (id === socket.id) {
            setTimeout(() => {
                emits.emitGetMovement( roomCode );
            }, 1700);
        }
        
    },

    onMovePiece: ( playerNumber, from, to, id ) => {
        console.log(`ID: ${id}`)
        console.log(`SOCKET.ID: ${socket.id} `)
        movePiece(playerNumber, from, to, id, socket.id, roomCode)
    },

    onReturnQuestion: ( question, options, id ) => {
        
        // se retorna del servidor la pregunta, opciones y quien hizo la pregunta
        divPregunta.innerHTML = `
            <div class="consigna">
                <p>${question}</p>
            </div>
            <div class="opciones"></div>
            <div class="tiempo"></div>
        `;

        // obtenemos la clase creada arriba
        const contenedorOpciones = divPregunta.querySelector(".opciones");

        // dependiendo la cantidad de opciones, es la cantidad de botones
        options.forEach((opcion, index) => {
            const boton = document.createElement("button");
            boton.textContent = `${index + 1}) ${opcion}`;
            boton.id = index;
            boton.classList.add("btn-opcion");
        
            // si el id de esta sesión es distina, se deshabilitan las opciones
            if (socket.id !== id) { 
                boton.disabled = true;
                boton.classList.add("desactivado");
            } else { 
                // SOLO si es mi turno, asigno la función onclick
                boton.onclick = () => {
                    // se envia el nombre de quien apretó y la opción seleccionada
                    emits.emitGetAnswer( roomCode, Number(boton.id) )

                    // Desactivar todas las opciones
                    document.querySelectorAll('.btn-opcion').forEach(btn => {
                        btn.disabled = true;
                        btn.classList.add("desactivado");
                    });
                };
            }

            contenedorOpciones.appendChild(boton);
        });

        resetTimer()
        startTimer()

    },

    onCorrectOption: ( correct, numberCorrect, option ) => {
        stopTimer()
        
        const btnCorrecta = document.getElementById(numberCorrect);
        btnCorrecta.style.backgroundColor = "green";

        if (!correct && option !== 3) {
            setTimeout(() => {
                const btnIncorrecta = document.getElementById(option);
                btnIncorrecta.style.backgroundColor = "red";
            }, 100);
        }
    },

    onGameOver: ( nickname, points ) => {
        showPopup(nickname, points, roomCode)
    },

    onReset: () => {
        popup.style.display = "none"

        document.querySelectorAll('.ficha').forEach(f => f.remove());
        divPregunta.innerHTML = "";
        document.getElementById("temporizador").innerHTML = "<p class='tiempo-default'>Tiempo</p>";
        botonDado.classList.add("disabledDado")
        botonDado.disabled = true;

        emits.emitReadyToRestart(roomCode)
    }
})

// Emitimos la reconexión una vez que el socket está inicializado
const socket = getSocket()
socket.emit("game:reconnect", { roomCode, playerId })

const btnDado = document.getElementById('btn-dado')
btnDado.addEventListener('click', function() {
    emits.emitTurn(roomCode)
})
       