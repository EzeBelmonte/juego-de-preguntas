// conectamos al servidor
const socket = io();
let jugadorActual = null;

document.addEventListener("DOMContentLoaded", () => {
    const main = document.getElementById("main");
    
    main.innerHTML = `
        <div class="sala-espera d-flex flex-column align-items-center">
            <h1>Bienvenido al juego de preguntas</h1>
            <div>
                <input type="text" id="nombre" placeholder="Escribe tu nombre">
                <button id="btn-ingresar" class="btn-comenzar">Ingresar</button>
            </div>
            <div id="estado" class="mt-3"></div>
        </div>
    `;

    // Luego de insertar el contenido, obtenemos referencias
    const inputNombre = document.getElementById("nombre");
    const btnIngresar = document.getElementById("btn-ingresar");
    const estado = document.getElementById("estado");

    // evento al hacer clic en el botón
    btnIngresar.addEventListener("click", () => {
        const nombre = inputNombre.value.trim();
        if (nombre !== "") {
            socket.emit("enviarNombre", nombre);
        }
    });

    socket.on("nombreRepetido", () => {
        estado.textContent = "Ese nombre ya está en uso. Elegí otro.";
        inputNombre.disabled = false;
        btnIngresar.disabled = false;
    });

    // si la sala está llena
    socket.on("salaLlena", () => {
        estado.textContent = "La sala ya tiene 2 jugadores. Esperá o volvé más tarde.";
        inputNombre.disabled = true;
        btnIngresar.disabled = true;
    });

    // si se agregó el jugador, se desactivan los botones e inputs
    socket.on("jugadorAceptado", (jugador) => {
        jugadorActual = jugador;
        estado.textContent = `Bienvenido, ${jugador.nombre}! Esperando al otro jugador...`;
        inputNombre.disabled = true;
        btnIngresar.disabled = true;
    });

    // se carga el tablero
    socket.on('esperandoConfirmacion', () => {
        main.innerHTML = `
            <div class="sala-espera">
                <h1>Clic para comenzar la partida</h1>
                <button id="btn-comenzar" class="btn-comenzar">Empezar</button>
                <div id="estado"></div>
            </div>
        `;

        // se escucha el clic del botón
        document.getElementById("btn-comenzar").addEventListener('click', (e) => {
            e.target.disabled = true;
            // enviamos al servidor que ya estamos para comenzar
            socket.emit('confirmado');
        });
    }); 

    socket.on('pasoAnterior', () => {
        main.innerHTML = `
            <div class="sala-espera d-flex flex-column align-items-center">
                <h1>Bienvenido al juego de preguntas</h1>
                <div id="estado" class="mt-3">
                    Bienvenido, ${jugadorActual.nombre}! Esperando al otro jugador...
                </div>
            </div>
        `;
    });

    // pasar a la siguiente ventana
    socket.on('comenzarJuego', () => {
        // se guarda el nombre para obtenerlo en la otra ventada
        if (jugadorActual && jugadorActual.nombre) {
            localStorage.setItem('nombre', jugadorActual.nombre);
        }
        
        window.location.href = '/juego';
    });

});
