const socket = io();

document.addEventListener('DOMContentLoaded', () => {
    // se recupera el nombre
    const nombre = localStorage.getItem('nombre');

    let yo = null;
    let oponente = null;


    // ==================================== JUGADORES
    // se actualizan los IDs
    socket.emit('actualizarIDs',( nombre ));
    
    
    // se reciben los datos
    socket.on('actualizarDatos', ({ jugadores }) => {
        yo = jugadores.find(j => j.nombre === nombre);
        localStorage.setItem('id', yo.id);
        oponente = jugadores.find(j => j.nombre !== nombre);

        const jugador1 = document.getElementById("jugador1");
        jugador1.innerHTML = `
            <div id="card-1" class="jugador-n"><p>${yo.nombre}</p></div>
            <div class="jugador-p"><p>${yo.puntaje}</p></div>
        `;

        const jugador2 = document.getElementById("jugador2");
        jugador2.innerHTML = `
            <div class="jugador-p"><p>${oponente.puntaje}</p></div>
            <div id="card-2" class="jugador-n"><p>${oponente.nombre}</p></div> 
        `;

        // se habilita el dado
        const botonDado = document.getElementById('btn-dado');
        botonDado.disabled = false;
    });
    

    // ==================================== TABLERO
    const tablero = document.getElementById("tablero");

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


    // ==================================== FICHA Y LÓGICA
    function crearFicha(jugador,posicion) {
        // se crea el div para la ficha
        const ficha = document.createElement("div");
        // asignar ID a la ficha
        ficha.id = `ficha-jugador-${jugador.nro}`;
        // le asignamos 2 clases
        ficha.className = `ficha jugador${jugador.nro}`;

        // agregar la ficha dentro del contenedor del tablero
        const tablero = document.getElementById("tablero");
        tablero.appendChild(ficha);

        console.log(posicion);
        // se obtiene las posiciones absolutas de la casilla y el tablero
        let lugarCasilla;
        if (posicion === 0) {
            lugarCasilla = document.getElementById("casilla-inicio");
        } else {
            lugarCasilla = document.getElementById(`casilla-${posicion}`);
        }
        const casillaRect = lugarCasilla.getBoundingClientRect();
        const tableroRect = tablero.getBoundingClientRect();

        // se calcula la posición horizontal relativa de la ficha dentro del tablero y se le suma el desplazamiento (20)
        ficha.style.left = (casillaRect.left - tableroRect.left + 20) + "px";

        // se guarda la posición vertical de cada ficha para que no se superpongan
        if (jugador.nro === 0) {
            ficha.style.top = (casillaRect.top - tableroRect.top + 10) + "px";
        } else {
            ficha.style.bottom = (tableroRect.bottom - casillaRect.bottom + 10) + "px";
        }
    }


    // se verifica si se tiene ficha
    socket.emit('fichaJugador');
    socket.on('crearFicha', ({ jugador, posicion }) => {
        if (!document.getElementById(`ficha-jugador-${jugador.nro}`)) {
            crearFicha(jugador,posicion);
        }
    });


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


    function moverFichaAnimada(jugador, desde, hasta) {
        const ficha = document.getElementById(`ficha-jugador-${jugador.nro}`);
        if (!ficha) return;

        // se guarda desde donde hay que moverse hasta donde moverse
        const idxDesde = recorrido.indexOf(desde);
        let idxHasta = recorrido.indexOf(hasta);

        // si el valor 'hasta' no está en el array o se pasa del final, se le da el valor "final"
        if (idxHasta === -1 || idxHasta >= recorrido.length) {
            idxHasta = recorrido.indexOf("final");
        }

        // se guardan la cantidad de pasis que se tiene que dar
        const pasos = recorrido.slice(idxDesde + 1, idxHasta + 1);

        // representa cada paso
        let i = 0;

        const moverPaso = () => {
            // cuando se llega al destino, se muestra la pregunta y se sale
            if (i >= pasos.length) { 
                socket.emit('obtenerPregunta');
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

                // depende del jugador, se posiciona la ficha
                if (jugador.nro === 0) {
                    // para jugador 0 que usa top
                    const offsetTop = casillaRect.top - tableroRect.top + 10;
                    ficha.style.top = `${offsetTop}px`;
                    ficha.style.bottom = "";
                } else if (jugador.nro === 1) {
                    // para jugador 1 que usa bottom
                    const offsetBottom = tableroRect.bottom - casillaRect.bottom + 10;
                    ficha.style.bottom = `${offsetBottom}px`;
                    ficha.style.top = "";
                }
            }

            // siguiente paso
            i++;
            // cooldown para el siguiente paso (velocidad)
            setTimeout(moverPaso, 200); 
        };

        moverPaso();
    }

    socket.on('moverFicha', ({ jugador, desde, hasta }) => {
       moverFichaAnimada(jugador, desde, hasta);
    });


    // ==================================== LÓGICA DEL JUEGO
    // animación dado
    const dado = document.getElementById("dado");
    const rotaciones = {
        1: { x: 0,   y: 0 },
        2: { x: 0,   y: 180 },
        3: { x: 0,   y: -90 },
        4: { x: 0,   y: 90 },
        5: { x: -90, y: 0 },
        6: { x: 90,  y: 0 }
    };

    // función de la animación
    function tirarDado(numero) {
        if (numero < 1 || numero > 6) return;

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

        const destino = rotaciones[numero];
        const rotX = destino.x + extraGiros.x;
        const rotY = destino.y + extraGiros.y;

        dado.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    }


    // asi se define la función para poder ser llamada desde el HTML.
    // se hace clic, enviando el nombre de quien hizo clic
    window.girarDado = function () {
        socket.emit('turno');
    }


    // se recibe el número generado en el servidor y hacemos la animación
    socket.on('recibirNumDado', ({ numero, nom }) => {
        const botonDado = document.getElementById('btn-dado');
        botonDado.disabled = true;
        tirarDado(numero);
        
        divPregunta.innerHTML = '';
        document.getElementById('temporizador').innerHTML = `<p class="tiempo-default">Tiempo</p>`;

        // tiempo de espera para obtener la pregunta
        if (nom === nombre) {
            setTimeout(() => {
                socket.emit('obtenerMovimiento');
            }, 1700);
        }
    });


    // mostrar pregunta
    const divPregunta = document.getElementById("pregunta");
    let pararTiempo = false;
    // se retorna del servidor la pregunta, opciones y quien hizo la pregunta
    socket.on('devolverPregunta', ({ pregunta, opciones, nom }) => {
        console.log("Escuchando evento 'devolverPregunta'...");

        divPregunta.innerHTML = `
            <div class="consigna">
                <p>${pregunta}</p>
            </div>
            <div class="opciones"></div>
            <div class="tiempo"></div>
        `;

        // obtenemos la clase creada arriba
        const contenedorOpciones = divPregunta.querySelector(".opciones");

        // dependiendo la cantidad de opciones, es la cantidad de botones
        opciones.forEach((opcion, index) => {
            const boton = document.createElement("button");
            boton.textContent = `${index + 1}) ${opcion}`;
            boton.id = index;
            boton.classList.add("btn-opcion");
        
            // si el nombre de esta sesión es distina, se deshabilitan las opciones
            if (nombre !== nom) { 
                boton.disabled = true;
                boton.classList.add("desactivado");
            } else { 
                // SOLO si es mi turno, asigno la función onclick
                boton.onclick = () => {
                    // se envia el nombre de quien apretó y la opción seleccionada
                    socket.emit('respuesta', {
                        opcion: Number(boton.id)
                    });

                    // Desactivar todas las opciones
                    document.querySelectorAll('.btn-opcion').forEach(btn => {
                        btn.disabled = true;
                        btn.classList.add("desactivado");
                    });
                };
            }

            contenedorOpciones.appendChild(boton);
        });

        cronometro();
    });


    function cronometro() {
        const temporizador = document.getElementById('temporizador');
        temporizador.innerHTML = `
            <p class="tiempo-title">Tiempo restante</p>
            <p class="tiempo-reloj">
                <span id="seg"></span>: <span id="mile"></span>
            </p>
        `;

        let seg = 9
        let mile = 100;

        setTimeout(() => {
            const milesimas = document.getElementById("mile");
            const segundos = document.getElementById("seg");

            const intervalo = setInterval(() => {
                mile--;
                // milesimas
                if (mile === 0) {
                    mile = 99;
                    seg--;
                }
                // segundos
                if (seg < 0 || pararTiempo) {
                    clearInterval(intervalo);

                    if (seg < 0) {
                        milesimas.textContent = "00";
                        segundos.textContent = "00";
                    }

                    const reloj = document.querySelector(".tiempo-reloj");
                    if (reloj) {
                        reloj.style.fontSize = "2.8rem";  // Aumenta

                        setTimeout(() => {
                            reloj.style.fontSize = "2.5rem";  // Vuelve a su tamaño original
                        }, 150);
                    }
                    
                    pararTiempo = false;
                    return;
                }

                // indicamos que si el string tiene 1 digito, se le agrega un cero adelante
                milesimas.textContent = mile.toString().padStart(2, '0');
                segundos.textContent = seg.toString().padStart(2, '0');
            }, 10);
        }, 30);
    }


    socket.on('mostrarOpcionCorrecta', ({correcta, nroPregunta, opElegida, detenerTiempo }) => {
        pararTiempo = detenerTiempo
        const btnCorrecta = document.getElementById(nroPregunta);
        btnCorrecta.style.backgroundColor = "green";

        if (!correcta && opElegida !== 3) {
            const btnIncorrecta = document.getElementById(opElegida);
            btnIncorrecta.style.backgroundColor = "red";
        }
    });


    const popup = document.getElementById("popup");
    socket.on('juegoFinalizado', ({ nom, puntos }) => {
        mostrarPopup(nom,puntos);
    });


    function mostrarPopup(nom,puntos) {
        popup.style.display = "block";
        popup.innerHTML = `
            <div class="popup-contenido">
                <p>Ganó el jugador <span class="ganador">${nom}</span></p>
                <p class="puntos">${puntos}</p>
                <p class="puntos-text">Puntos</p>
                <button id="cerrarPopup" class="btn-reiniciar">Jugar otra vez</button>
            </div>
        `;
        lanzarConfeti();
        // esperar que el DOM esté actualizado antes de agregar el listener
        setTimeout(() => {
            const btn = document.getElementById("cerrarPopup");
            if (btn) {
                btn.addEventListener('click', () => {
                    socket.emit('reiniciandoJuego');
                }, { once: true });
            }
        }, 0);
    };


    //socket.emit('reiniciandoJuego')
    socket.on('reiniciar', () => {
        popup.style.display = "none";
        window.location.href = "/juego";
    });
});


function lanzarConfeti() {
    confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
    });

    // espera un poco y después ajustar el canvas para que quede al frente
    setTimeout(() => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            // para fijarlo
            canvas.style.position = 'fixed';
            // posicion del fijado
            canvas.style.top = 0;
            canvas.style.left = 0;
            // tamaño del canvas
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            // para que no se bloquee el botón de "jugar otra vez"
            canvas.style.pointerEvents = 'none';
            // para que aparezca al frente de todo
            canvas.style.zIndex = 9999;
        }
    }, 50); // pequeño delay para que el canvas se cree
}